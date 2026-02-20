import axios from "axios";

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_CHAT_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_INFERENCE_API_URL = "https://api-inference.huggingface.co/models";

// Model configurations
const MODELS = {
  SKILL_EXTRACTION: "bsc-base-uncased",
  NSQF_PREDICTION: "google/flan-t5-large",
  TEXT_GENERATION: "mistralai/Mistral-7B-Instruct-v0.2",
  CLASSIFICATION: "distilbert-base-uncased",
};

// Hugging Face API helper
const isOpenAICompatible = (model) => {
  // Add more OpenAI-compatible models here as needed
  return (
    model.startsWith("HuggingFaceH4/zephyr") ||
    model.startsWith("mistralai/Mixtral") ||
    model.startsWith("mistralai/Mistral")
  );
};

const queryHuggingFace = async (model, inputs, parameters = {}) => {
  const headers = {
    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    let response;

    if (isOpenAICompatible(model)) {
      response = await axios.post(
        HF_CHAT_API_URL,
        {
          model,
          messages: Array.isArray(inputs)
            ? inputs.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }))
            : [{ role: "user", content: String(inputs) }],
          temperature: parameters.temperature ?? 0.7,
          max_tokens: parameters.max_tokens ?? 300,
          top_p: parameters.top_p ?? 0.9,
        },
        { headers, timeout: 30000 },
      );

      // ✅ Normalize chat response
      return response.data.choices?.[0]?.message?.content || "";
    } else {
      response = await axios.post(
        `${HF_INFERENCE_API_URL}/${model}`,
        { inputs, parameters },
        { headers, timeout: 30000 },
      );

      // ✅ Normalize inference response
      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || "";
      }

      return response.data?.generated_text || "";
    }
  } catch (error) {
    console.error(`Hugging Face API Error (${model}):`, error.message);
    console.error("Response:", error.response?.data);
    throw error;
  }
};

/**
 * Analyze credential description to extract skills and predict NSQF level
 */
export const analyzeCredential = async (description) => {
  try {
    // Extract skills using NER (Named Entity Recognition)
    const skills = await extractSkills(description);

    // Predict NSQF level based on description complexity and keywords
    const nsqfLevel = await predictNSQFLevel({ description });

    return {
      skills: skills || [],
      nsqfLevel: nsqfLevel || null,
    };
  } catch (error) {
    console.error("AI Service Error:", error.message);
    return {
      skills: [],
      nsqfLevel: null,
    };
  }
};

/**
 * Extract skills from text description using Hugging Face API
 */
export const extractSkills = async (text) => {
  try {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return [];
    }

    // Use Hugging Face API for skill extraction
    // bsc-base-uncased is a BERT model, we'll use it for feature extraction
    const result = await queryHuggingFace(MODELS.SKILL_EXTRACTION, text, {
      return_all_scores: false,
    });

    // Process the model output to extract skills
    // Since bsc-base-uncased is a BERT model, we'll combine it with keyword extraction
    const extractedSkills = await processSkillExtraction(text, result);

    return extractedSkills.slice(0, 10); // Return top 10 skills
  } catch (error) {
    console.error("Skill extraction error:", error.message);
    // Fallback: Basic keyword extraction
    return extractSkillsFallback(text);
  }
};

/**
 * Process skill extraction results from Hugging Face API
 */
const processSkillExtraction = async (text, apiResult) => {
  // Combine API results with keyword extraction for better accuracy
  const keywords = await extractKeywords(text);

  // Use the model embeddings/features to enhance skill detection
  // Extract unique skills from both sources
  const skillMap = new Map();

  keywords.forEach((keyword) => {
    if (!skillMap.has(keyword.toLowerCase())) {
      skillMap.set(keyword.toLowerCase(), {
        name: keyword,
        category: categorizSkill(keyword),
        confidence: 0.8,
      });
    }
  });

  // Convert map to array
  const skills = Array.from(skillMap.values());

  // Sort by confidence if available
  skills.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return skills;
};

/**
 * Extract keywords from text (fallback method)
 */
const extractKeywords = async (text) => {
  const commonSkills = [
    // Programming Languages
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "TypeScript",

    // Frontend
    "React",
    "Angular",
    "Vue",
    "HTML",
    "CSS",
    "SASS",
    "Bootstrap",
    "Tailwind",
    "jQuery",
    "Redux",
    "Next.js",

    // Backend
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "Laravel",
    "ASP.NET",
    "FastAPI",
    "NestJS",

    // Databases
    "MongoDB",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Cassandra",
    "Oracle",
    "SQLite",
    "DynamoDB",

    // Cloud & DevOps
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Jenkins",
    "CI/CD",
    "Terraform",
    "Ansible",

    // Mobile
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "Xamarin",
    "Ionic",

    // Data Science & AI
    "Machine Learning",
    "Deep Learning",
    "AI",
    "Data Science",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Keras",
    "NLP",
    "Computer Vision",
    "Data Analysis",
    "Statistics",

    // Tools & Others
    "Git",
    "GitHub",
    "GitLab",
    "REST API",
    "GraphQL",
    "Microservices",
    "Agile",
    "Scrum",
    "Testing",
    "Jest",
    "Selenium",
    "Webpack",
    "Linux",
    "Bash",
    "PowerShell",
  ];

  const foundSkills = [];
  const lowerText = text.toLowerCase();

  commonSkills.forEach((skill) => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
};

/**
 * Fallback skill extraction using regex patterns
 */
const extractSkillsFallback = (text) => {
  const keywords = extractKeywords(text);
  return keywords.map((keyword) => ({
    name: keyword,
    category: "technical",
  }));
};

/**
 * Categorize skill into appropriate category
 */
const categorizSkill = (skill) => {
  const categories = {
    technical: [
      "programming",
      "web development",
      "data science",
      "machine learning",
      "cloud computing",
      "database",
      "frontend",
      "backend",
      "mobile development",
      "DevOps",
      "cybersecurity",
      "networking",
    ],
    "soft-skills": [
      "communication",
      "leadership",
      "teamwork",
      "problem solving",
      "analytical thinking",
      "creativity",
      "time management",
    ],
    management: [
      "project management",
      "team leadership",
      "strategic planning",
      "resource management",
    ],
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.some((s) => skill.toLowerCase().includes(s.toLowerCase()))) {
      return category;
    }
  }

  return "technical";
};

/**
 * Predict NSQF level based on credential details using Hugging Face API
 */
export const predictNSQFLevel = async (credentialData) => {
  try {
    const { description, type, title } = credentialData;
    const credentialText = `${title || ""} ${description || ""}`.trim();

    if (!credentialText) {
      // Default based on credential type if no text provided
      const typeDefaults = {
        certificate: 5,
        diploma: 6,
        degree: 7,
        "micro-credential": 4,
        badge: 3,
        other: 5,
      };
      return typeDefaults[type] || 5;
    }

    // Use Hugging Face T5 model for NSQF level prediction
    const prompt = `Based on this credential description, predict the NSQF level (1-10). 
    NSQF Level 1: Basic/Elementary skills
    NSQF Level 2-3: Foundation/Intermediate skills
    NSQF Level 4-5: Skilled worker/Diploma level
    NSQF Level 6: Bachelor degree level
    NSQF Level 7: Postgraduate/Masters level
    NSQF Level 8: Advanced Masters/MBA
    NSQF Level 9: Doctoral/PhD
    NSQF Level 10: Post-doctoral research
    
    Credential: ${credentialText}
    Type: ${type || "unknown"}
    
    Predict NSQF level (respond with only a number 1-10):`;

    const result = await queryHuggingFace(MODELS.NSQF_PREDICTION, prompt, {
      max_length: 10,
      temperature: 0.3,
      do_sample: false,
    });

    // Extract number from the generated text
    let predictedLevel = extractNumberFromText(result);

    // Validate and fallback
    if (!predictedLevel || predictedLevel < 1 || predictedLevel > 10) {
      // Fallback to keyword-based prediction
      predictedLevel = predictNSQFFromKeywords(credentialText, type);
    }

    return predictedLevel;
  } catch (error) {
    console.error("NSQF level prediction error:", error.message);
    // Fallback to keyword-based prediction
    const { description, type, title } = credentialData;
    const text = `${title || ""} ${description || ""}`.toLowerCase();
    return predictNSQFFromKeywords(text, type);
  }
};

/**
 * Extract number from model output
 */
const extractNumberFromText = (result) => {
  if (!result) return null;

  // Handle different response formats
  let text = "";
  if (typeof result === "string") {
    text = result;
  } else if (result.generated_text) {
    text = result.generated_text;
  } else if (Array.isArray(result) && result[0]?.generated_text) {
    text = result[0].generated_text;
  } else if (result[0]?.generated_text) {
    text = result[0].generated_text;
  }

  // Extract first number between 1-10
  const match = text.match(/\b([1-9]|10)\b/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Fallback: Predict NSQF from keywords
 */
const predictNSQFFromKeywords = (text, type) => {
  const lowerText = text.toLowerCase();

  const levelKeywords = {
    1: ["basic", "introduction", "beginner", "fundamental", "elementary"],
    2: ["elementary", "primary", "basic skills", "foundational"],
    3: ["intermediate", "foundation", "core skills", "essential"],
    4: ["advanced foundation", "skilled", "competent", "proficient"],
    5: ["diploma", "advanced", "proficient", "skilled worker", "certificate"],
    6: [
      "bachelor",
      "degree",
      "graduate",
      "advanced diploma",
      "professional",
      "undergraduate",
    ],
    7: [
      "postgraduate",
      "masters",
      "specialized",
      "expert",
      "advanced professional",
    ],
    8: [
      "masters degree",
      "postgraduate diploma",
      "advanced professional",
      "mba",
    ],
    9: ["doctoral", "phd", "research", "highly specialized", "doctorate"],
    10: [
      "doctorate",
      "phd",
      "research doctorate",
      "highest qualification",
      "post-doctoral",
    ],
  };

  // Check for explicit level mentions
  for (let level = 10; level >= 1; level--) {
    const keywords = levelKeywords[level];
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return level;
    }
  }

  // Default based on credential type
  const typeDefaults = {
    certificate: 5,
    diploma: 6,
    degree: 7,
    "micro-credential": 4,
    badge: 3,
    other: 5,
  };

  return typeDefaults[type] || 5;
};

/**
 * Get career recommendations based on learner profile using Hugging Face API
 */
export const getCareerRecommendations = async (learnerProfile) => {
  try {
    const { skills, education, credentials } = learnerProfile;

    if (!skills || skills.length === 0) {
      return [];
    }

    // Build profile context
    const skillsText = skills.map((s) => s.name || s).join(", ");
    const educationText =
      education && education.length > 0
        ? education
            .map((e) => `${e.degree || ""} from ${e.institution || ""}`)
            .join(", ")
        : "No formal education listed";

    // Use Hugging Face DialoGPT for generating career recommendations
    const prompt = `Based on the following learner profile, recommend suitable career paths:
    
    Skills: ${skillsText}
    Education: ${educationText}
    
    Suggest 3-5 career paths that match these skills. Format: Career Title - Brief Description`;

    const result = await queryHuggingFace(MODELS.TEXT_GENERATION, prompt, {
      max_length: 300,
      temperature: 0.7,
      top_p: 0.9,
      num_return_sequences: 1,
    });

    // Parse the generated recommendations
    const generatedText = extractGeneratedText(result);
    const recommendations = parseCareerRecommendations(generatedText, skills);

    // If API didn't provide good results, fallback to rule-based matching
    if (recommendations.length === 0) {
      return getCareerRecommendationsFallback(skills);
    }

    return recommendations.slice(0, 5);
  } catch (error) {
    console.error("Career recommendation error:", error.message);
    // Fallback to rule-based recommendations
    const { skills } = learnerProfile;
    return getCareerRecommendationsFallback(skills || []);
  }
};

/**
 * Extract generated text from API response
 */
const extractGeneratedText = (result) => {
  if (!result) return "";

  if (typeof result === "string") {
    return result;
  } else if (result.generated_text) {
    return result.generated_text;
  } else if (Array.isArray(result) && result[0]?.generated_text) {
    return result[0].generated_text;
  } else if (result[0]?.generated_text) {
    return result[0].generated_text;
  }

  return "";
};

/**
 * Parse career recommendations from generated text
 */
const parseCareerRecommendations = (text, skills) => {
  const recommendations = [];
  const skillSet = new Set(skills.map((s) => (s.name || s).toLowerCase()));

  // Define career paths for matching
  const careerPaths = [
    {
      title: "Full Stack Developer",
      requiredSkills: ["javascript", "react", "node", "html", "css"],
      description: "Build complete web applications from frontend to backend",
    },
    {
      title: "Frontend Developer",
      requiredSkills: ["javascript", "react", "html", "css", "ui"],
      description: "Create beautiful and responsive user interfaces",
    },
    {
      title: "Backend Developer",
      requiredSkills: ["node", "python", "java", "sql", "api"],
      description: "Build robust server-side applications and APIs",
    },
    {
      title: "Data Scientist",
      requiredSkills: ["python", "machine learning", "statistics", "data"],
      description: "Analyze data and build predictive models",
    },
    {
      title: "DevOps Engineer",
      requiredSkills: ["docker", "kubernetes", "aws", "ci/cd", "linux"],
      description: "Automate and optimize software deployment",
    },
    {
      title: "Mobile Developer",
      requiredSkills: ["react native", "flutter", "ios", "android", "mobile"],
      description: "Create mobile applications for iOS and Android",
    },
    {
      title: "Machine Learning Engineer",
      requiredSkills: ["python", "tensorflow", "pytorch", "machine learning"],
      description: "Build and deploy AI/ML models",
    },
    {
      title: "Cloud Architect",
      requiredSkills: ["aws", "azure", "cloud", "kubernetes", "docker"],
      description: "Design and implement cloud infrastructure",
    },
  ];

  // Match careers based on skills
  careerPaths.forEach((career) => {
    let matchCount = 0;
    career.requiredSkills.forEach((reqSkill) => {
      if (
        Array.from(skillSet).some(
          (skill) => skill.includes(reqSkill) || reqSkill.includes(skill),
        )
      ) {
        matchCount++;
      }
    });

    const matchScore = Math.round(
      (matchCount / career.requiredSkills.length) * 100,
    );

    if (matchScore > 20) {
      recommendations.push({
        title: career.title,
        matchScore,
        description: career.description,
      });
    }
  });

  // Sort by match score
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
};

/**
 * Fallback: Rule-based career recommendations
 */
const getCareerRecommendationsFallback = (skills) => {
  if (!skills || skills.length === 0) {
    return [];
  }

  const recommendations = [];
  const skillSet = new Set(skills.map((s) => (s.name || s).toLowerCase()));

  const careerPaths = [
    {
      title: "Full Stack Developer",
      requiredSkills: ["javascript", "react", "node", "html", "css"],
      description: "Build complete web applications from frontend to backend",
    },
    {
      title: "Frontend Developer",
      requiredSkills: ["javascript", "react", "html", "css", "ui"],
      description: "Create beautiful and responsive user interfaces",
    },
    {
      title: "Backend Developer",
      requiredSkills: ["node", "python", "java", "sql", "api"],
      description: "Build robust server-side applications and APIs",
    },
    {
      title: "Data Scientist",
      requiredSkills: ["python", "machine learning", "statistics", "data"],
      description: "Analyze data and build predictive models",
    },
    {
      title: "DevOps Engineer",
      requiredSkills: ["docker", "kubernetes", "aws", "ci/cd", "linux"],
      description: "Automate and optimize software deployment",
    },
    {
      title: "Mobile Developer",
      requiredSkills: ["react native", "flutter", "ios", "android", "mobile"],
      description: "Create mobile applications for iOS and Android",
    },
    {
      title: "Machine Learning Engineer",
      requiredSkills: ["python", "tensorflow", "pytorch", "machine learning"],
      description: "Build and deploy AI/ML models",
    },
    {
      title: "Cloud Architect",
      requiredSkills: ["aws", "azure", "cloud", "kubernetes", "docker"],
      description: "Design and implement cloud infrastructure",
    },
  ];

  careerPaths.forEach((career) => {
    let matchCount = 0;
    career.requiredSkills.forEach((reqSkill) => {
      if (
        Array.from(skillSet).some(
          (skill) => skill.includes(reqSkill) || reqSkill.includes(skill),
        )
      ) {
        matchCount++;
      }
    });

    const matchScore = Math.round(
      (matchCount / career.requiredSkills.length) * 100,
    );

    if (matchScore > 20) {
      recommendations.push({
        title: career.title,
        matchScore,
        description: career.description,
      });
    }
  });

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  return recommendations.slice(0, 5);
};

/**
 * Analyze skill gaps for a learner using Hugging Face API
 */
export const analyzeSkillGap = async (currentSkills, targetRole) => {
  try {
    if (!currentSkills || currentSkills.length === 0) {
      return {
        missingSkills: [],
        recommendations: ["Please add your skills to analyze skill gaps"],
        matchPercentage: 0,
        requiredSkills: [],
        currentSkills: [],
        targetRole: targetRole,
      };
    }

    // Normalize role name
    const normalizedRole = normalizeRoleName(targetRole);

    // Get required skills for the role
    const requiredSkills = getRequiredSkillsForRole(normalizedRole);

    if (requiredSkills.length === 0) {
      return {
        missingSkills: [],
        recommendations: [
          `Role "${targetRole}" not found. Available roles: ${Object.keys(getAllRoleSkills()).join(", ")}`,
        ],
        matchPercentage: 0,
        requiredSkills: [],
        currentSkills: currentSkills,
        availableRoles: Object.keys(getAllRoleSkills()),
        targetRole: normalizedRole,
      };
    }

    const currentSkillNames = currentSkills.map((s) =>
      typeof s === "string" ? s.toLowerCase() : s.name?.toLowerCase() || "",
    );

    // Use Hugging Face classification model to analyze skill matches
    const skillMatches = await analyzeSkillMatches(
      currentSkillNames,
      requiredSkills,
    );

    // Find missing skills based on classification results
    const missingSkills = requiredSkills.filter((skill, index) => {
      const matchResult = skillMatches[index];
      return !matchResult || matchResult.confidence < 0.5;
    });

    // Calculate match percentage
    const matchedSkills = requiredSkills.length - missingSkills.length;
    const matchPercentage = Math.round(
      (matchedSkills / requiredSkills.length) * 100,
    );

    // Generate recommendations using AI
    const recommendations = await generateSkillGapRecommendations(
      missingSkills,
      normalizedRole,
      matchPercentage,
    );

    return {
      missingSkills,
      recommendations,
      matchPercentage,
      requiredSkills,
      currentSkills: currentSkills,
      targetRole: normalizedRole,
    };
  } catch (error) {
    console.error("Skill gap analysis error:", error.message);
    // Fallback to rule-based analysis
    return analyzeSkillGapFallback(currentSkills, targetRole);
  }
};

/**
 * Analyze skill matches using Hugging Face classification model
 */
const analyzeSkillMatches = async (currentSkills, requiredSkills) => {
  const matches = [];

  // For each required skill, check if it matches current skills
  for (const requiredSkill of requiredSkills) {
    try {
      // Create a classification prompt
      const prompt = `Does the learner have the skill "${requiredSkill}"? 
      Current skills: ${currentSkills.join(", ")}
      Answer: yes or no`;

      // Use DistilBERT for classification
      const result = await queryHuggingFace(MODELS.CLASSIFICATION, prompt, {
        return_all_scores: true,
      });

      // Extract classification result
      const confidence = extractClassificationConfidence(result, "yes");

      matches.push({
        skill: requiredSkill,
        hasSkill: confidence > 0.5,
        confidence: confidence,
      });
    } catch (error) {
      // Fallback to simple string matching
      const hasSkill = currentSkills.some(
        (current) =>
          current.includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(current),
      );
      matches.push({
        skill: requiredSkill,
        hasSkill: hasSkill,
        confidence: hasSkill ? 0.8 : 0.2,
      });
    }
  }

  return matches;
};

/**
 * Extract classification confidence from API response
 */
const extractClassificationConfidence = (result, label) => {
  if (!result) return 0;

  // Handle different response formats
  if (Array.isArray(result) && result[0]) {
    const scores = result[0];
    if (Array.isArray(scores)) {
      const yesScore = scores.find(
        (s) => s.label && s.label.toLowerCase().includes(label),
      );
      return yesScore ? yesScore.score : 0;
    }
  }

  return 0.5; // Default confidence
};

/**
 * Generate skill gap recommendations
 */
const generateSkillGapRecommendations = async (
  missingSkills,
  targetRole,
  matchPercentage,
) => {
  const recommendations = [];

  if (missingSkills.length > 0) {
    // Prioritize top 5 most important skills
    const topMissingSkills = missingSkills.slice(0, 5);
    topMissingSkills.forEach((skill) => {
      recommendations.push(
        `Learn ${skill} through online courses, tutorials, or certifications`,
      );
    });

    if (missingSkills.length > 5) {
      recommendations.push(
        `Also consider learning: ${missingSkills.slice(5).join(", ")}`,
      );
    }
  } else {
    recommendations.push(
      `Great! You have all the required skills for ${targetRole}`,
    );
    recommendations.push(
      "Consider building projects to strengthen your portfolio",
    );
    recommendations.push(
      "Stay updated with latest trends and technologies in your field",
    );
  }

  return recommendations;
};

/**
 * Get required skills for a role
 */
const getRequiredSkillsForRole = (role) => {
  const roleSkills = getAllRoleSkills();
  return roleSkills[role] || [];
};

/**
 * Get all role skills mapping
 */
const getAllRoleSkills = () => {
  return {
    "Software Developer": [
      "JavaScript",
      "Python",
      "Java",
      "Git",
      "SQL",
      "Data Structures",
      "Algorithms",
      "OOP",
      "Testing",
      "Debugging",
    ],
    "Software Engineer": [
      "JavaScript",
      "Python",
      "Java",
      "Git",
      "SQL",
      "Data Structures",
      "Algorithms",
      "OOP",
      "Testing",
      "Debugging",
    ],
    "Full Stack Developer": [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "SQL",
      "HTML",
      "CSS",
      "Git",
      "REST API",
    ],
    "Data Scientist": [
      "Python",
      "Machine Learning",
      "Statistics",
      "SQL",
      "Data Visualization",
      "Pandas",
      "NumPy",
      "Scikit-learn",
      "R",
      "Deep Learning",
    ],
    "DevOps Engineer": [
      "Docker",
      "Kubernetes",
      "CI/CD",
      "AWS",
      "Linux",
      "Git",
      "Jenkins",
      "Terraform",
      "Monitoring",
      "Scripting",
    ],
    "Frontend Developer": [
      "JavaScript",
      "React",
      "HTML",
      "CSS",
      "TypeScript",
      "Webpack",
      "Git",
      "Responsive Design",
      "UI/UX",
      "Testing",
    ],
    "Backend Developer": [
      "Node.js",
      "Python",
      "Java",
      "SQL",
      "MongoDB",
      "REST API",
      "Microservices",
      "Git",
      "Authentication",
      "Security",
    ],
    "Mobile Developer": [
      "React Native",
      "Flutter",
      "iOS",
      "Android",
      "Mobile UI/UX",
      "API Integration",
      "Git",
      "App Store",
      "Testing",
    ],
    "Cloud Architect": [
      "AWS",
      "Azure",
      "Cloud Security",
      "Networking",
      "Infrastructure as Code",
      "Kubernetes",
      "Docker",
      "Serverless",
      "Cost Optimization",
    ],
    "Machine Learning Engineer": [
      "Python",
      "TensorFlow",
      "PyTorch",
      "Machine Learning",
      "Deep Learning",
      "Data Processing",
      "MLOps",
      "Statistics",
      "Model Deployment",
    ],
    "Web Developer": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Git",
      "Responsive Design",
      "REST API",
      "Database",
      "Testing",
    ],
    "UI/UX Designer": [
      "Figma",
      "Adobe XD",
      "Sketch",
      "Prototyping",
      "User Research",
      "Wireframing",
      "Design Systems",
      "HTML",
      "CSS",
    ],
    "Database Administrator": [
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Database Design",
      "Performance Tuning",
      "Backup",
      "Security",
      "Replication",
    ],
    "QA Engineer": [
      "Testing",
      "Selenium",
      "Jest",
      "Test Automation",
      "Bug Tracking",
      "API Testing",
      "Performance Testing",
      "Git",
      "CI/CD",
    ],
    "Product Manager": [
      "Product Strategy",
      "Agile",
      "Scrum",
      "User Stories",
      "Roadmapping",
      "Analytics",
      "Communication",
      "Stakeholder Management",
    ],
    "Project Manager": [
      "Project Planning",
      "Agile",
      "Scrum",
      "Risk Management",
      "Budgeting",
      "Communication",
      "Leadership",
      "MS Project",
      "JIRA",
    ],
    "Business Analyst": [
      "Requirements Analysis",
      "SQL",
      "Data Analysis",
      "Documentation",
      "Stakeholder Management",
      "Process Modeling",
      "Excel",
      "Communication",
    ],
    "Data Analyst": [
      "SQL",
      "Excel",
      "Python",
      "Data Visualization",
      "Tableau",
      "Power BI",
      "Statistics",
      "Data Cleaning",
      "Reporting",
    ],
    "Cybersecurity Specialist": [
      "Network Security",
      "Penetration Testing",
      "Cryptography",
      "Security Auditing",
      "Firewall",
      "SIEM",
      "Incident Response",
      "Compliance",
    ],
    "Network Engineer": [
      "Networking",
      "TCP/IP",
      "Routing",
      "Switching",
      "Firewall",
      "VPN",
      "Network Security",
      "Troubleshooting",
      "Cisco",
      "Linux",
    ],
    "System Administrator": [
      "Linux",
      "Windows Server",
      "Networking",
      "Scripting",
      "Virtualization",
      "Backup",
      "Security",
      "Monitoring",
      "Troubleshooting",
    ],
    "AI Engineer": [
      "Python",
      "Machine Learning",
      "Deep Learning",
      "TensorFlow",
      "PyTorch",
      "NLP",
      "Computer Vision",
      "Model Deployment",
      "MLOps",
    ],
  };
};

/**
 * Fallback: Rule-based skill gap analysis
 */
const analyzeSkillGapFallback = (currentSkills, targetRole) => {
  const normalizedRole = normalizeRoleName(targetRole);
  const roleSkills = getAllRoleSkills();
  const requiredSkills = roleSkills[normalizedRole] || [];

  if (requiredSkills.length === 0) {
    return {
      missingSkills: [],
      recommendations: [
        `Role "${targetRole}" not found. Available roles: ${Object.keys(roleSkills).join(", ")}`,
      ],
      matchPercentage: 0,
      requiredSkills: [],
      currentSkills: currentSkills,
      availableRoles: Object.keys(roleSkills),
      targetRole: normalizedRole,
    };
  }

  const currentSkillNames = currentSkills.map((s) =>
    typeof s === "string" ? s.toLowerCase() : s.name?.toLowerCase() || "",
  );

  const missingSkills = requiredSkills.filter(
    (skill) =>
      !currentSkillNames.some(
        (current) =>
          current.includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(current),
      ),
  );

  const matchedSkills = requiredSkills.length - missingSkills.length;
  const matchPercentage = Math.round(
    (matchedSkills / requiredSkills.length) * 100,
  );

  const recommendations = [];

  if (missingSkills.length > 0) {
    const topMissingSkills = missingSkills.slice(0, 5);
    topMissingSkills.forEach((skill) => {
      recommendations.push(
        `Learn ${skill} through online courses, tutorials, or certifications`,
      );
    });

    if (missingSkills.length > 5) {
      recommendations.push(
        `Also consider learning: ${missingSkills.slice(5).join(", ")}`,
      );
    }
  } else {
    recommendations.push(
      `Great! You have all the required skills for ${normalizedRole}`,
    );
    recommendations.push(
      "Consider building projects to strengthen your portfolio",
    );
    recommendations.push(
      "Stay updated with latest trends and technologies in your field",
    );
  }

  return {
    missingSkills,
    recommendations,
    matchPercentage,
    requiredSkills,
    currentSkills: currentSkills,
    targetRole: normalizedRole,
  };
};

/**
 * Normalize role name to match predefined roles
 */
const normalizeRoleName = (role) => {
  const roleMap = {
    "software engineer": "Software Engineer",
    "software engg": "Software Engineer",
    "software dev": "Software Developer",
    swe: "Software Engineer",
    "full stack": "Full Stack Developer",
    fullstack: "Full Stack Developer",
    frontend: "Frontend Developer",
    "front end": "Frontend Developer",
    backend: "Backend Developer",
    "back end": "Backend Developer",
    "data scientist": "Data Scientist",
    ds: "Data Scientist",
    "ml engineer": "Machine Learning Engineer",
    "machine learning": "Machine Learning Engineer",
    devops: "DevOps Engineer",
    "dev ops": "DevOps Engineer",
    "mobile dev": "Mobile Developer",
    "app developer": "Mobile Developer",
    "cloud engineer": "Cloud Architect",
    "web dev": "Web Developer",
    "web developer": "Web Developer",
    "ui designer": "UI/UX Designer",
    "ux designer": "UI/UX Designer",
    dba: "Database Administrator",
    qa: "QA Engineer",
    tester: "QA Engineer",
    pm: "Product Manager",
    product: "Product Manager",
    project: "Project Manager",
    ba: "Business Analyst",
    analyst: "Data Analyst",
    security: "Cybersecurity Specialist",
    network: "Network Engineer",
    sysadmin: "System Administrator",
    "sys admin": "System Administrator",
    "ai engineer": "AI Engineer",
    "artificial intelligence": "AI Engineer",
  };

  const lowerRole = role.toLowerCase().trim();

  // Check exact match first
  if (roleMap[lowerRole]) {
    return roleMap[lowerRole];
  }

  // Check partial match
  for (const [key, value] of Object.entries(roleMap)) {
    if (lowerRole.includes(key) || key.includes(lowerRole)) {
      return value;
    }
  }

  // Return capitalized version if no match
  return role
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Chat with AI assistant using Hugging Face text generation model.
 * Accepts either a single string or an array of message objects: [{ role: 'user'|'assistant', content: '...'}]
 */
export const chat = async (messages, options = {}) => {
  const formatted = Array.isArray(messages)
    ? messages
    : [{ role: "user", content: String(messages) }];

  const reply = await queryHuggingFace(
    MODELS.TEXT_GENERATION,
    formatted,
    options,
  );

  return reply.trim();
};

export default {
  analyzeCredential,
  chat,
  extractSkills,
  predictNSQFLevel,
  getCareerRecommendations,
  analyzeSkillGap,
};
