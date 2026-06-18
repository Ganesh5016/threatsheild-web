import pytest
import pandas as pd
from datetime import datetime
import os

# Store test results
test_results = []

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    # Execute all other hooks to obtain the report object
    outcome = yield
    rep = outcome.get_result()
    
    # We only look at actual test calls, not setup/teardown
    if rep.when == "call":
        # Extract metadata from the test item
        test_id = item.get_closest_marker("test_id")
        test_id_val = test_id.args[0] if test_id else "N/A"
        
        module = item.get_closest_marker("module")
        module_val = module.args[0] if module else "General"
        
        test_type = item.get_closest_marker("test_type")
        test_type_val = test_type.args[0] if test_type else "Functionality"
        
        # Get parameter description if parameterized
        desc = item.name
        if hasattr(item, "callspec"):
            if "desc" in item.callspec.params:
                desc = item.callspec.params["desc"]
            elif "payload" in item.callspec.params:
                 desc = f"Payload: {item.callspec.params['payload']}"

        result = "PASS" if rep.passed else "FAIL"
        error_message = ""
        if rep.failed:
            error_message = str(rep.longreprtext).split('\n')[-1][:200] # Get the last line of the traceback

        test_results.append({
            "Test Case ID": test_id_val,
            "Module": module_val,
            "Type": test_type_val,
            "Description": desc,
            "Result": result,
            "Duration (s)": round(rep.duration, 2),
            "Error Message": error_message
        })

def pytest_sessionfinish(session, exitstatus):
    """
    Called after whole test run finished, right before returning the exit status to the system.
    Generates the Excel report.
    """
    if not test_results:
        print("No test results to report.")
        return

    df = pd.DataFrame(test_results)
    
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    report_name = f"E2E_Test_Report_ThreatShield_{timestamp}.xlsx"
    
    # Ensure the reports directory exists
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    report_path = os.path.join(reports_dir, report_name)
    
    df.to_excel(report_path, index=False)
    print(f"\n[+] Test report successfully generated: {report_path}")
