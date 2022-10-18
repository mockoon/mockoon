import requests


# Test Parameters
server_ip = '127.0.0.1'
port = 3001
request_timeout = 2
num_extra_checks_to_be_confident_value_is_not_changing = 5

# API Configuration
status4 = dict(
    N="New",
    R="Ready",
    U="Used",
)
invalid_profile_status = 'Invalid Profile'
url_base = f"http://{server_ip}:{port}/model"


def reset_request_number(model_id=None, expected_status=None, simple=False):
    simple = '-simple' if simple else ''
    url = f"{url_base}{simple}/anything"
    key = f"params:id:{model_id}" if model_id else 'endpoint'
    headers = {"X-Mockoon-Request-Number-Reset": key}
    response = requests.get(url, headers=headers, timeout=request_timeout)
    message = f"Resetting request number for {key} should yield HTTP status code"
    if expected_status:
        assert response.status_code == expected_status, f"{message} {expected_status}"
    else:
        assert response.status_code in (200, 404), f"{message} 200 or 404"


def get_status(model_id, simple=False):
    simple = '-simple' if simple else ''
    url = f"{url_base}{simple}/{model_id}"
    response = requests.get(url, timeout=request_timeout)
    record = response.json()
    return record["status"]


def profile_test(profile_id, is_invalid_profile=False, reset_before=True):
    model_id = f"model-{profile_id}-test"

    if reset_before:
        reset_request_number(model_id)

    expected_status = None
    for status_abbrev in profile_id:
        expected_status = invalid_profile_status if is_invalid_profile else status4[status_abbrev]
        status = get_status(model_id)
        assert status == expected_status, f"Status is expected to be {expected_status}."

    for _ in range(num_extra_checks_to_be_confident_value_is_not_changing):
        status = get_status(model_id)
        assert status == expected_status, f"Status is expected to continue indefinitely as {expected_status}."


def simple_profile_test(profile_id):
    model_id = f"model-{profile_id}-test-simple"

    reset_request_number(model_id, simple=True)

    expected_status = None
    for status_abbrev in profile_id:
        expected_status = status4[status_abbrev]
        status = get_status(model_id, simple=True)
        assert status == expected_status, f"Status is expected to be {expected_status}."

    for _ in range(num_extra_checks_to_be_confident_value_is_not_changing):
        status = get_status(model_id, simple=True)
        assert status == expected_status, f"Status is expected to continue indefinitely as {expected_status}."


def test_profile_R():
    profile_test("R")
    simple_profile_test("R")


def test_profile_U():
    profile_test("U")
    simple_profile_test("U")


def test_profile_N():
    profile_test("N")
    simple_profile_test("N")


def test_profile_NR():
    profile_test("NR")
    simple_profile_test("NR")


def test_profile_NRU():
    profile_test("NRU")
    simple_profile_test("NRU")


def test_profile_RRU():
    profile_test("RRU")
    simple_profile_test("RRU")


def test_profile_NRRRU():
    profile_test("NRRRU")
    simple_profile_test("NRRRU")


def test_profile_invalid():
    profile_test("RUN", is_invalid_profile=True)


def test_reset_endpoint_request_number():
    reset_request_number(None, 200)


def test_reset_existing_resource_request_number():
    reset_request_number('model-NRU-alpha')
    get_status('model-NRU-alpha')
    reset_request_number('model-NRU-alpha')


def test_reset_nonexisting_resource_request_number():
    reset_request_number('model-RRU-alpha')
    reset_request_number('model-RRU-alpha', 404)

