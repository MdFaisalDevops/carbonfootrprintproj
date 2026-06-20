import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add the parent directory to the path so python can find backend.app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, db_users

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"app": "CarbonMind AI API", "status": "operational", "engine": "FastAPI"}

def test_get_leaderboard():
    response = client.get("/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    # Verify sorted descending by carbon score
    scores = [u["carbon_score"] for u in data]
    assert scores == sorted(scores, reverse=True)

def test_get_user_rank_success():
    response = client.get("/user/rank/user_1")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "user_1"
    assert "rank" in data
    assert "total_competitors" in data
    assert data["user_data"]["name"] == "Kunal Shah"

def test_get_user_rank_not_found():
    response = client.get("/user/rank/nonexistent_user")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

def test_get_user_badges_success():
    response = client.get("/user/badges/user_1")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "user_1"
    assert "badges" in data
    assert isinstance(data["badges"], list)

def test_get_user_badges_not_found():
    response = client.get("/user/badges/nonexistent_user")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

def test_sync_user_data_existing():
    payload = {
        "user_id": "user_self",
        "carbon_score": 600,
        "level": "Eco Beginner",
        "badges": ["consistency", "plant_based"],
        "weekly_co2_saved": 55.5,
        "streak_days": 13
    }
    response = client.post("/user/sync", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "Sync successful", "status": "synchronized"}
    
    # Check that mock db is updated
    assert db_users["user_self"]["carbon_score"] == 600
    assert db_users["user_self"]["streak_days"] == 13
    assert "plant_based" in db_users["user_self"]["badges"]

def test_sync_user_data_new():
    payload = {
        "user_id": "user_new",
        "carbon_score": 850,
        "level": "Balanced User",
        "badges": ["low_car"],
        "weekly_co2_saved": 75.0,
        "streak_days": 5
    }
    response = client.post("/user/sync", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "Sync successful", "status": "synchronized"}
    assert "user_new" in db_users
    assert db_users["user_new"]["carbon_score"] == 850

def test_ask_ai_coach_offline_fallback():
    # Make sure env is empty to force offline reasoning check
    if "OPENAI_API_KEY" in os.environ:
        del os.environ["OPENAI_API_KEY"]
        
    payload = {
        "user_id": "user_self",
        "question": "How do I optimize my AC footprint in Bangalore?",
        "lifestyle": {
            "transport_habits": "car_single",
            "diet_pattern": "meat_heavy",
            "electricity_usage": "high",
            "waste_generation": "none",
            "shopping_frequency": "medium"
        }
    }
    response = client.post("/coach/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "carbon_personality_type" in data
    assert "total_footprint_estimate" in data
    assert "impact_hotspots" in data
    assert "top_3_actions" in data
    assert len(data["top_3_actions"]) == 3
    assert "micro_actions" in data
    assert "future_projection_30_days" in data
    assert "motivational_insight" in data

def test_ask_ai_coach_invalid_input():
    # Send incorrect habit options to check Literal constraints
    payload = {
        "user_id": "user_self",
        "question": "Testing inputs",
        "lifestyle": {
            "transport_habits": "rocket_ship",  # Invalid transport
            "diet_pattern": "vegetarian",
            "electricity_usage": "low",
            "waste_generation": "compost",
            "shopping_frequency": "low"
        }
    }
    response = client.post("/coach/ask", json=payload)
    assert response.status_code == 422  # Pydantic Literal validation error

def test_sync_user_data_invalid():
    # Send invalid type for carbon_score to verify field types validation
    payload = {
        "user_id": "user_self",
        "carbon_score": "should_be_int",  # Invalid type
        "level": "Eco Beginner",
        "badges": ["consistency"],
        "weekly_co2_saved": 48.2,
        "streak_days": 12
    }
    response = client.post("/user/sync", json=payload)
    assert response.status_code == 422

from unittest.mock import MagicMock, patch

def test_ask_ai_coach_with_openai_mock():
    # Mock OPENAI_API_KEY environment variable
    with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-fake-key-for-test"}):
        # Create a mock client and completion response
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"carbon_personality_type": "Balanced User", "total_footprint_estimate": "5.5 kg CO2/day", "impact_hotspots": ["energy"], "top_3_actions": [{"action": "Test action", "why_it_matters": "testing", "co2_saving_estimate": "1kg", "effort_level": "low"}], "micro_actions": ["micro1"], "future_projection_30_days": "looks good", "motivational_insight": "keep going"}'
                )
            )
        ]
        
        # Patch the OpenAI client's completion creation method
        with patch("app.OpenAI") as mock_openai_class:
            mock_client = MagicMock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai_class.return_value = mock_client
            
            # Reset cached client state to force instantiation
            with patch("app._openai_client_cached", None):
                payload = {
                    "user_id": "user_self",
                    "question": "How to optimize energy?",
                    "lifestyle": {
                        "transport_habits": "ev",
                        "diet_pattern": "vegetarian",
                        "electricity_usage": "low",
                        "waste_generation": "compost",
                        "shopping_frequency": "low"
                    }
                }
                response = client.post("/coach/ask", json=payload)
                assert response.status_code == 200
                data = response.json()
                assert data["carbon_personality_type"] == "Balanced User"
                assert data["impact_hotspots"] == ["energy"]
                assert data["top_3_actions"][0]["action"] == "Test action"

