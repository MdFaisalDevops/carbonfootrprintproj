"""
CarbonMind AI — FastAPI Backend Service
Implements carbon calculation logic, leaderboard rank tracking,
badges management, and the Master AI Coach prompt system.
"""

import os
from typing import List, Optional, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
import uvicorn
import json

_openai_client_cached: Optional[OpenAI] = None

# Setup FastAPI App
app = FastAPI(
    title="CarbonMind AI Backend",
    description="Sustainability reasoning and gamification API engine",
    version="1.0.0"
)

# CORS configuration for Vercel/Local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve static directory — works both locally and in Docker /app layout
# Priority: 1) PROJECT_ROOT/static  2) CWD/static  3) ../static from this file
_here = os.path.dirname(os.path.abspath(__file__))
_candidates = [
    os.path.join(_here, "..", "static"),          # local: backend/../static
    os.path.join(os.getcwd(), "static"),           # Docker: /app/static
    os.path.join(_here, "static"),                 # fallback
]
STATIC_DIR = next((p for p in _candidates if os.path.isdir(p)), _candidates[0])

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Root route — serves the main index.html SPA
@app.get("/", include_in_schema=False)
async def serve_frontend():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    return {"app": "CarbonMind AI API", "status": "operational", "engine": "FastAPI"}

# -------------------------------------------------------------
# DATA MODELS
# -------------------------------------------------------------
class LifestyleData(BaseModel):
    transport_habits: Literal["car_single", "car_pool", "metro", "ev", "cycle"]
    diet_pattern: Literal["meat_heavy", "meat_moderate", "vegetarian", "vegan"]
    electricity_usage: Literal["high", "medium", "low", "solar"]
    waste_generation: Literal["none", "basic", "compost"]
    shopping_frequency: Optional[Literal["high", "medium", "low", "minimal"]] = "medium"


class CoachQuery(BaseModel):
    user_id: str
    question: str
    lifestyle: LifestyleData

class UserActivity(BaseModel):
    user_id: str
    carbon_score: int
    level: str
    badges: List[str]
    weekly_co2_saved: float
    streak_days: int

# -------------------------------------------------------------
# MOCK DATABASE & STATE
# -------------------------------------------------------------
db_users = {
    "user_1": {
        "user_id": "user_1",
        "name": "Kunal Shah",
        "carbon_score": 920,
        "level": "Green Optimizer",
        "badges": ["low_car", "energy_saver", "consistency"],
        "weekly_co2_saved": 85.4,
        "streak_days": 28
    },
    "user_2": {
        "user_id": "user_2",
        "name": "Priya Sharma",
        "carbon_score": 810,
        "level": "Balanced User",
        "badges": ["low_car", "plant_based"],
        "weekly_co2_saved": 62.1,
        "streak_days": 15
    },
    "user_self": {
        "user_id": "user_self",
        "name": "Arjun Mehta",
        "carbon_score": 550,
        "level": "Eco Beginner",
        "badges": ["consistency"],
        "weekly_co2_saved": 48.2,
        "streak_days": 12
    },
    "user_3": {
        "user_id": "user_3",
        "name": "Amit Patel",
        "carbon_score": 510,
        "level": "Eco Beginner",
        "badges": ["plant_based"],
        "weekly_co2_saved": 29.5,
        "streak_days": 4
    },
    "user_4": {
        "user_id": "user_4",
        "name": "Neha Gupta",
        "carbon_score": 340,
        "level": "Eco Beginner",
        "badges": [],
        "weekly_co2_saved": 12.0,
        "streak_days": 2
    }
}

# -------------------------------------------------------------
# MASTER AI COACH PROMPT TEMPLATE
# -------------------------------------------------------------
MASTER_COACH_PROMPT_SYSTEM = """You are CarbonMind AI, an advanced sustainability intelligence engine.
Your job is to analyze a user's lifestyle and act like a personal carbon strategist.

INPUT YOU RECEIVE:
User lifestyle data:
- transport habits
- diet pattern
- electricity usage
- shopping frequency
- waste generation

YOUR TASK:
1. Behavioral Understanding
Identify:
- unconscious high-impact habits
- lifestyle category
- emission intensity level

2. Carbon Reasoning
Do NOT give generic advice.
Instead:
- analyze cause -> effect
- prioritize highest CO2 contributors
- compare alternatives realistically for an Indian urban user

3. Generate Output in THIS STRUCTURE (JSON ONLY):
{
  "carbon_personality_type": "",
  "total_footprint_estimate": "",
  "impact_hotspots": [],
  "top_3_actions": [
    {
      "action": "",
      "why_it_matters": "",
      "co2_saving_estimate": "",
      "effort_level": "low | medium | high"
    }
  ],
  "micro_actions": [],
  "future_projection_30_days": "",
  "motivational_insight": ""
}

4. Personality Classification Types:
- Eco Beginner
- Conscious Commuter
- Balanced Lifestyle User
- High Impact Consumer
- Green Optimizer

5. RULES:
- Be precise, not generic
- Avoid preaching or guilt
- Focus on realistic Indian lifestyle alternatives
- Prefer actionable micro-changes
- Always rank actions by impact
- OUTPUT MUST BE JSON ONLY. No extra markdown tags or text around the JSON block.
"""

# -------------------------------------------------------------
# CORE ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    return {"app": "CarbonMind AI API", "status": "operational", "engine": "FastAPI"}

@app.get("/leaderboard")
async def get_leaderboard():
    """
    Returns users ranked by carbon score descending.
    """
    sorted_users = sorted(
        db_users.values(),
        key=lambda x: x["carbon_score"],
        reverse=True
    )
    return sorted_users

@app.get("/user/rank/{user_id}")
async def get_user_rank(user_id: str):
    """
    Returns the user's specific leaderboard status and relative rank.
    """
    if user_id not in db_users:
        raise HTTPException(status_code=404, detail="User not found")
        
    sorted_users = sorted(
        db_users.values(),
        key=lambda x: x["carbon_score"],
        reverse=True
    )
    
    rank = 1
    for index, u in enumerate(sorted_users):
        if u["user_id"] == user_id:
            rank = index + 1
            break
            
    return {
        "user_id": user_id,
        "rank": rank,
        "total_competitors": len(sorted_users),
        "user_data": db_users[user_id]
    }

@app.get("/user/badges/{user_id}")
async def get_user_badges(user_id: str):
    """
    Returns user badges list.
    """
    if user_id not in db_users:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "badges": db_users[user_id]["badges"]}

@app.post("/user/sync")
async def sync_user_data(data: UserActivity):
    """
    Syncs local score details to the server.
    """
    if data.user_id not in db_users:
        # Create a new user mapping if needed
        db_users[data.user_id] = {
            "user_id": data.user_id,
            "name": "Arjun Mehta", # Fallback default
        }
        
    db_users[data.user_id].update({
        "carbon_score": data.carbon_score,
        "level": data.level,
        "badges": data.badges,
        "weekly_co2_saved": data.weekly_co2_saved,
        "streak_days": data.streak_days
    })
    
    return {"message": "Sync successful", "status": "synchronized"}

@app.post("/coach/ask")
async def ask_ai_coach(query: CoachQuery):
    """
    Queries OpenAI or falls back to an offline carbon reasoning logic 
    configured with the Master prompt rules.
    """
    prompt_inputs = f"""
    Lifestyle Input:
    - transport habits: {query.lifestyle.transport_habits}
    - diet pattern: {query.lifestyle.diet_pattern}
    - electricity usage: {query.lifestyle.electricity_usage}
    - shopping frequency: {query.lifestyle.shopping_frequency}
    - waste generation: {query.lifestyle.waste_generation}
    
    User Question: {query.question}
    """
    
    # Check if OpenAI key is configured
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if openai_key:
        try:
            global _openai_client_cached
            if _openai_client_cached is None:
                _openai_client_cached = OpenAI(api_key=openai_key)
            
            response = _openai_client_cached.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": MASTER_COACH_PROMPT_SYSTEM},
                    {"role": "user", "content": prompt_inputs}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            structured_data = json.loads(response.choices[0].message.content)
            return structured_data
            
        except Exception as e:
            # Fallback to local intelligence logic if API request fails
            pass
            
    # LOCAL RAIN-CHECK INTELLIGENCE LOGIC (Matches Indian Urban User Rules)
    # If no API key, execute rule-based reasoning engine matching identical formatting.
    t_habit = query.lifestyle.transport_habits
    d_habit = query.lifestyle.diet_pattern
    e_habit = query.lifestyle.electricity_usage
    w_habit = query.lifestyle.waste_generation
    
    # Determine profile type
    score = 1000
    # Apply deductions
    t_deduct = {"car_single": 200, "car_pool": 100, "metro": 30, "ev": 15, "cycle": 0}
    d_deduct = {"meat_heavy": 150, "meat_moderate": 80, "vegetarian": 25, "vegan": 0}
    e_deduct = {"high": 100, "medium": 50, "low": 15, "solar": 0}
    w_deduct = {"none": 80, "basic": 25, "compost": 0}
    
    score -= t_deduct.get(t_habit, 100)
    score -= d_deduct.get(d_habit, 80)
    score -= e_deduct.get(e_habit, 50)
    score -= w_deduct.get(w_habit, 25)
    
    if score <= 300: personality = "High Impact Consumer"
    elif score <= 600: personality = "Eco Beginner"
    elif score <= 750: personality = "Conscious Commuter"
    elif score <= 900: personality = "Balanced Lifestyle User"
    else: personality = "Green Optimizer"

    # Pre-crafted custom reasoning branches to keep responses hyper-realistic
    actions = []
    hotspots = []
    
    if t_habit == "car_single":
        hotspots.append("Solo commuting in conventional fuel vehicles")
        actions.append({
            "action": "Shift high-traffic commutes to Metro Rail transit",
            "why_it_matters": "Mass electric transits cut direct car carbon footprints by over 85% in Indian metropolitan areas.",
            "co2_saving_estimate": "340 kg CO₂ annually",
            "effort_level": "medium"
        })
    else:
        actions.append({
            "action": "Consolidate travel routines and ensure proper tire pressure",
            "why_it_matters": "Properly pressurized tires reduce rolling drag, saving up to 4% fuel usage in stop-and-go city drives.",
            "co2_saving_estimate": "45 kg CO₂ annually",
            "effort_level": "low"
        })
        
    if d_habit == "meat_heavy":
        hotspots.append("High greenhouse intensity red meat dietary habits")
        actions.append({
            "action": "Integrate local lentils (pulses) or chicken in place of mutton/beef",
            "why_it_matters": "Poultry production is 5x less carbon intensive than lamb/beef, while lentils create close to zero direct emissions.",
            "co2_saving_estimate": "120 kg CO₂ annually per weekly swap",
            "effort_level": "medium"
        })
    else:
        actions.append({
            "action": "Adopt local grains (Millets / Ragi) instead of long-transit polished white rice",
            "why_it_matters": "Millets require vastly less water-pumping infrastructure emissions and are extremely eco-friendly.",
            "co2_saving_estimate": "30 kg CO₂ annually",
            "effort_level": "low"
        })
        
    if e_habit == "high":
        hotspots.append("Heavy air-conditioning electrical loading")
        actions.append({
            "action": "Activate fan conjunction and set AC thermostat to 24°C",
            "why_it_matters": "Avoids cold-cycling the compressor which causes huge grid electricity demands.",
            "co2_saving_estimate": "180 kg CO₂ annually",
            "effort_level": "low"
        })
    else:
        actions.append({
            "action": "Clean passive compressor fins and dust appliance cooling pipes",
            "why_it_matters": "Dirty elements increase compressor work by up to 15% to move hot air out.",
            "co2_saving_estimate": "40 kg CO₂ annually",
            "effort_level": "medium"
        })

    # Ensure we always have exactly 3 recommendations
    if len(actions) < 3:
        actions.append({
            "action": "Divert kitchen food waste into home composting systems",
            "why_it_matters": "Prevents organic materials from undergoing anaerobic decomposition inside landfills which discharges methane gas.",
            "co2_saving_estimate": "80 kg CO₂ annually",
            "effort_level": "low"
        })
        
    return {
        "carbon_personality_type": personality,
        "total_footprint_estimate": f"Estimated daily footprint of {(1000 - score)/20:.1f} kg CO₂/day",
        "impact_hotspots": hotspots if hotspots else ["General grid energy consumption"],
        "top_3_actions": actions[:3],
        "micro_actions": [
            "Use natural ventilation during evening hours in Bangalore/Pune",
            "Unplug power bricks when appliances are fully charged",
            "Carry a reusable canvas bag for local vegetable shopping"
        ],
        "future_projection_30_days": f"Adopting these rules will improve your score to {min(1000, score + 120)} and save ~45 kg CO₂ next month.",
        "motivational_insight": "Small shifts in Indian urban routines (like AC settings and local millets) carry enormous collective leverage. You are in control."
    }

# Entrypoint — reads PORT from environment (Cloud Run injects $PORT)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
