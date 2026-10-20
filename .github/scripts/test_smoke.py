import importlib.util
from pathlib import Path
import subprocess
import unittest
from unittest.mock import MagicMock, patch

spec = importlib.util.spec_from_file_location("frontend_smoke", Path(__file__).with_name("smoke.py"))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def test_checks_static_history_health_and_api_and_cleans_only_test_container(self):
        result = subprocess.CompletedProcess([], 0, stdout="127.0.0.1:49152\n")
        responses = []
        for body in [b"<html>test</html>", b"<html>test</html>", b'{"status":"ok"}', b'{"probe":"forwarded-with-api-prefix"}']:
            response = MagicMock()
            response.__enter__.return_value.read.return_value = body
            responses.append(response)
        server = MagicMock()
        server.server_port = 49153
        with patch.object(smoke.http.server, "ThreadingHTTPServer", return_value=server), patch.object(smoke.threading, "Thread"), patch.object(smoke.subprocess, "run", return_value=result) as run, patch.object(smoke.urllib.request, "urlopen", side_effect=responses) as fetch:
            smoke.main("local-frontend:test")
        self.assertEqual([call.args[0] for call in fetch.call_args_list], ["http://127.0.0.1:49152/", "http://127.0.0.1:49152/dashboard", "http://127.0.0.1:49152/health", "http://127.0.0.1:49152/api/ci-probe"])
        cleanup = run.call_args_list[-1].args[0]
        self.assertEqual(cleanup[:4], ["docker", "rm", "-f", "-v"])
        self.assertTrue(cleanup[-1].startswith("admin-web-ci-"))
        server.shutdown.assert_called_once()
        server.server_close.assert_called_once()

    def test_failed_container_start_does_not_delete_unrelated_resources(self):
        with patch.object(smoke.http.server, "ThreadingHTTPServer"), patch.object(smoke.threading, "Thread"), patch.object(smoke.subprocess, "run", side_effect=subprocess.CalledProcessError(1, "docker")) as run:
            with self.assertRaises(subprocess.CalledProcessError):
                smoke.main("local-frontend:test")
        self.assertEqual(run.call_count, 1)


if __name__ == "__main__":
    unittest.main()
