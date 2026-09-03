import { GoogleGenAI, Type } from '@google/genai';

// Server-side Gemini Client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Print Doctor
export async function handlePrintDoctor(issueDescription: string, printType: string, paperType: string) {
  const ai = getGenAI();
  const prompt = `You are a Senior Master Pressman and Print Quality Engineer with 25+ years experience in Offset, Digital, Flexo, Screen, and Large Format printing.
Analyze the following print defect or technical press issue:
- Print Technology: ${printType || 'General Printing'}
- Substrate / Paper Stock: ${paperType || 'Standard Stock'}
- Reported Issue / Defect: ${issueDescription}

Provide a structured, highly actionable diagnostic report with:
1. Primary Diagnosis & Severity Level (Critical, Major, Minor)
2. Likely Root Causes (Mechanical, Ink/Solvent, Paper/Substrate, File/Prepress, Environmental)
3. Immediate Press/Machine Adjustments (Dampening, Impression pressure, Heater/UV intensity, Roller nip, Ink viscosity)
4. Pre-press / Software File Fixes (Overprint settings, Resolution, Color profile, Trapping)
5. Preventive Maintenance Tip for Print Shop
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      systemInstruction: 'You are PrintPilot AI Doctor, an expert print press troubleshooting assistant for commercial printing shops.',
      temperature: 0.2,
    },
  });

  return { result: response.text };
}

// 2. AI Poster Generator
export async function handlePosterGenerator(prompt: string, category: string, colorScheme: string, dimensions: string) {
  const ai = getGenAI();
  const fullPrompt = `Create a print-ready poster design specification for:
- Subject/Theme: ${prompt}
- Category: ${category || 'Event'}
- Target Dimensions: ${dimensions || 'A2 (420 x 594 mm)'}
- Color Palette Preference: ${colorScheme || 'Modern Vibrant'}

Respond in valid JSON with:
{
  "title": "Poster Headline Title",
  "subtitle": "Secondary Tagline",
  "colorPalette": {
    "primaryHex": "#HEX",
    "secondaryHex": "#HEX",
    "accentHex": "#HEX",
    "backgroundHex": "#HEX",
    "textColorHex": "#HEX",
    "cmykEquivalent": "C: % M: % Y: % K: %"
  },
  "typography": {
    "headerFont": "Font Family suggestion",
    "bodyFont": "Font Family suggestion"
  },
  "layoutSections": ["Header Block", "Hero Graphic Zone", "Details Grid", "Footer Callout"],
  "printSpecs": {
    "dpi": 300,
    "bleedMargin": "3mm (0.125 in)",
    "safeZoneMargin": "5mm",
    "recommendedPaper": "250 GSM Gloss Art Paper"
  },
  "svgArtwork": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600' width='100%' height='100%' style='background-color: #HEX;'><rect x='0' y='0' width='400' height='600' fill='...'/><text ...>Headline</text></svg>"
}
Include a complete, valid vector SVG mockup in the svgArtwork field with dimensions 400x600, using the generated color scheme, stylish typography layout, decorative geometric elements, and bleed crop lines at edges!
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: fullPrompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 3. AI Visiting Card Generator
export async function handleCardGenerator(cardDetails: {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  style: string;
  colorScheme: string;
}) {
  const ai = getGenAI();
  const prompt = `Design a premium, 300 DPI print-ready double-sided business card layout for:
Name: ${cardDetails.name || 'John Doe'}
Title: ${cardDetails.title || 'Creative Director'}
Company: ${cardDetails.company || 'Apex Design Studio'}
Phone: ${cardDetails.phone || '+1 (555) 019-2834'}
Email: ${cardDetails.email || 'john@apexdesign.com'}
Website: ${cardDetails.website || 'www.apexdesign.com'}
Address: ${cardDetails.address || '100 Metro Tower, San Francisco CA'}
Style Preference: ${cardDetails.style || 'Minimalist Luxury'}
Color Scheme: ${cardDetails.colorScheme || 'Navy & Gold'}

Respond in valid JSON format:
{
  "cardTitle": "Style Name",
  "recommendedStock": "350 GSM Velvet Touch Matte + Gold Foil",
  "dimensions": "3.5 x 2.0 inches (US Standard) + 0.125 in Bleed",
  "colors": {
    "bgHex": "#HEX",
    "textPrimary": "#HEX",
    "accentHex": "#HEX"
  },
  "frontSvg": "<svg viewBox='0 0 350 200' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "backSvg": "<svg viewBox='0 0 350 200' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "finishingSuggestions": ["Soft-Touch Lamination", "Spot UV on Logo", "Rounded Corners 3mm"]
}
Ensure both frontSvg and backSvg are full, valid, beautiful SVGs (350x200 aspect ratio) with exact typography, crisp vector layout, trim safety guidelines, and company details!
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 4. AI Resume Builder
export async function handleResumeBuilder(resumeData: {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}) {
  const ai = getGenAI();
  const prompt = `Build a high-impact, ATS-optimized, 1-page print-ready professional resume for:
Full Name: ${resumeData.fullName}
Target Role: ${resumeData.jobTitle}
Email: ${resumeData.email}
Phone: ${resumeData.phone}
Location: ${resumeData.location}
Professional Summary: ${resumeData.summary}
Skills List: ${resumeData.skills}
Work History: ${resumeData.experience}
Education: ${resumeData.education}

Respond in valid JSON with:
{
  "formattedName": "...",
  "tagline": "...",
  "executiveSummary": "Refined 3-sentence summary",
  "keySkills": ["Skill 1", "Skill 2"],
  "formattedExperience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "period": "2022 - Present",
      "bullets": ["Action verb driven achievement 1", "Achievement 2"]
    }
  ],
  "formattedEducation": [
    {
      "degree": "Degree Name",
      "institution": "University / College",
      "year": "2021"
    }
  ],
  "printOptimizationTips": [
    "Use 100 GSM Bright White Uncoated Bond Paper",
    "Maintain 0.5 inch margins for standard binder punching",
    "Font Size: 10.5pt for body text for optimal 300 DPI print clarity"
  ]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 5. AI Image Enhancer & Scale Calculator
export async function handleImageEnhancer(imageMeta: {
  fileName?: string;
  width?: number;
  height?: number;
  targetPrintSize?: string;
}) {
  const ai = getGenAI();
  const prompt = `You are a Pre-Press Raster Image Technician.
Analyze an image with dimensions ${imageMeta.width || 1920} x ${imageMeta.height || 1080} pixels being evaluated for physical print size: "${imageMeta.targetPrintSize || 'A3 Poster (11.7 x 16.5 inches)'}".

Calculate exact DPI, scale suitability, and supply expert image optimization feedback.

Respond in JSON:
{
  "calculatedDpi": 185,
  "qualityRating": "Good (Acceptable for view distance > 2 feet)",
  "maxRecommendedPrintSizeAt300Dpi": "6.4 x 3.6 inches",
  "maxRecommendedPrintSizeAt150Dpi": "12.8 x 7.2 inches",
  "enhancementSteps": [
    "AI Super-Resolution 2x Upscaling recommended to reach 300 DPI",
    "Apply Unsharp Mask (Amount: 120%, Radius: 1.2px, Threshold: 3) to counter dot gain",
    "Convert color space from sRGB to US Web Coated (SWOP) v2 CMYK profile"
  ],
  "upscaleOptions": {
    "recommendedMultiplier": "2x",
    "newEstimatedWidth": 3840,
    "newEstimatedHeight": 2160,
    "resultingDpiAtTarget": 370
  }
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 6. AI Print Cost Estimator
export async function handleCostEstimator(specs: {
  itemType: string;
  quantity: number;
  sheetSize: string;
  paperGsm: number;
  paperType: string;
  colorType: string;
  finishing: string[];
  turnaroundDays: number;
}) {
  const ai = getGenAI();
  const prompt = `Act as an expert Commercial Printing Estimator & Estimating Manager.
Calculate print production cost breakdown, paper utilization, gang run efficiency, and profit margin for the following job:
- Item Type: ${specs.itemType}
- Quantity: ${specs.quantity}
- Parent Sheet Size: ${specs.sheetSize || '12 x 18 inches'}
- Paper Weight: ${specs.paperGsm || 300} GSM ${specs.paperType || 'Art Card'}
- Color: ${specs.colorType || '4/4 CMYK Double Sided'}
- Finishing Operations: ${(specs.finishing || []).join(', ') || 'Thermal Lamination'}
- Turnaround Target: ${specs.turnaroundDays || 2} Days

Provide a realistic industry cost analysis in valid JSON:
{
  "estimatedRawPaperCost": 45.00,
  "estimatedPlateAndPrepressCost": 20.00,
  "estimatedInkSolventCost": 18.50,
  "estimatedFinishingCost": 35.00,
  "laborAndMachineCost": 30.00,
  "totalBaseProductionCost": 148.50,
  "suggestedRetailPrice": 225.00,
  "estimatedProfitMargin": "34%",
  "perUnitPrice": 0.225,
  "sheetOptimization": {
    "upsPerSheet": 8,
    "totalParentSheetsRequired": 125,
    "spoilageAllowanceSheets": 15,
    "paperWastePercent": "6.2%"
  },
  "costSavingsTips": [
    "Switch to a standard 13x19 sheet size to fit 10 ups instead of 8 (saves 20% paper stock)",
    "Combine with secondary job on gang-run plate to eliminate plate cost"
  ]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 7. AI Color Correction Advisor
export async function handleColorAdvisor(colorData: {
  rgbColors?: string[];
  imageDescription?: string;
  targetSubstrate?: string;
}) {
  const ai = getGenAI();
  const prompt = `Act as a Pre-press Color Scientist & Gamut Calibration Expert.
Analyze color fidelity for printing on substrate: "${colorData.targetSubstrate || 'Coated Art Paper (Gloss/Matte)'}".
Input RGB Palette or Color Description: ${colorData.rgbColors ? colorData.rgbColors.join(', ') : 'Vibrant Neon Blue (#0033FF), Electric Green (#00FF66), Crimson Red (#FF0033)'}.

Identify out-of-gamut warnings for offset/digital CMYK printing, convert to closest CMYK percentages, recommend exact Pantone (PMS) spot color matches, and total ink limit (TAC/TIC) checks.

Respond in JSON:
{
  "gamutStatus": "Warning: Vibrant RGB colors detected out of standard CMYK gamut",
  "analyzedColors": [
    {
      "sourceRgb": "#0033FF",
      "cmykEquivalent": "C: 98% M: 80% Y: 0% K: 0%",
      "inGamut": false,
      "gamutShiftWarning": "Electric RGB blue will shift slightly duller/muted in 4-color process print.",
      "recommendedPantone": "Pantone 2728 C (Spot Color)",
      "correctedHexForScreenPreview": "#1B3A9E"
    },
    {
      "sourceRgb": "#FF0033",
      "cmykEquivalent": "C: 0% M: 100% Y: 85% K: 0%",
      "inGamut": true,
      "gamutShiftWarning": "Excellent gamut match.",
      "recommendedPantone": "Pantone 186 C",
      "correctedHexForScreenPreview": "#D90429"
    }
  ],
  "totalInkCoverageAdvice": "Max ink density estimated at 263%, safely within the 300% TAC limit for coated paper.",
  "pressProfileRecommendation": "GRACoL2006_Coated1v2 or ISO Coated v2 300%"
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}

// 8. AI Print Readiness Checker (Pre-flight Scanner)
export async function handlePreflightCheck(fileData: {
  fileName: string;
  fileSizeMb?: number;
  widthInches?: number;
  heightInches?: number;
  declaredDpi?: number;
  colorSpace?: string;
  hasBleed?: boolean;
}) {
  const ai = getGenAI();
  const prompt = `Act as an automated Pre-Flight Inspection Engine for a commercial print shop.
Analyze file parameters for:
File Name: ${fileData.fileName || 'banner_final.pdf'}
Size: ${fileData.fileSizeMb || 12.4} MB
Dimensions: ${fileData.widthInches || 18} x ${fileData.heightInches || 24} inches
Declared Resolution: ${fileData.declaredDpi || 180} DPI
Color Space: ${fileData.colorSpace || 'RGB'}
Has Bleed Area: ${fileData.hasBleed ? 'Yes (3mm)' : 'No Bleed Detected'}

Evaluate against professional pre-flight standards (300 DPI for hand-held, 150 DPI for large format, CMYK color space, 3mm bleed margin, font embedding, safety zone).

Respond in JSON:
{
  "overallStatus": "Pass" or "Warning" or "Reject",
  "preflightScore": 82,
  "checklistResults": [
    {
      "checkItem": "Resolution & DPI",
      "status": "Warning",
      "detail": "180 DPI is slightly low for 18x24 inches hand-held viewing (300 DPI recommended)."
    },
    {
      "checkItem": "Color Space",
      "status": "Fail",
      "detail": "File is in RGB color mode. Must be converted to CMYK prior to plate making."
    },
    {
      "checkItem": "Bleed & Cut Margins",
      "status": "Pass",
      "detail": "3mm bleed margin verified."
    },
    {
      "checkItem": "Safety Zone & Text Margin",
      "status": "Pass",
      "detail": "All critical text is > 5mm inside trim edge."
    },
    {
      "checkItem": "Font Embedding & Outlines",
      "status": "Pass",
      "detail": "All fonts converted to outlines/curves."
    }
  ],
  "autoFixActions": [
    "Convert color profile to FOGRA39 CMYK",
    "Apply 0.125 inch mirror bleed extension automatically",
    "Sharpen text vector paths"
  ],
  "downloadableCertificate": {
    "certificateId": "PR-98421",
    "timestamp": "Jul 22, 2026",
    "inspector": "PrintPilot AI Automated Engine v1.0"
  }
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return { data: JSON.parse(response.text || '{}') };
}
