const SEGMENT_URL = 'https://sdk.photoroom.com/v1/segment';
const EDIT_URL = 'https://image-api.photoroom.com/v2/edit';

async function fetchPhotoroom(url, apiKey, form, extraHeaders = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      ...extraHeaders,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.blob();
}

export async function removeBackground(apiKey, blob) {
  const form = new FormData();
  form.append('image_file', blob, 'image.png');
  form.append('format', 'png');
  form.append('size', 'auto');
  form.append('despill', 'medium');

  return fetchPhotoroom(SEGMENT_URL, apiKey, form);
}

function createEditForm(blob, fields) {
  const form = new FormData();
  form.append('imageFile', blob, 'image.png');

  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, value);
  });

  return form;
}

export async function upscaleImage(apiKey, blob) {
  const form = createEditForm(blob, {
    referenceBox: 'originalImage',
    removeBackground: 'false',
    'upscale.mode': 'ai.fast',
  });

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function uncropImage(apiKey, blob) {
  const form = createEditForm(blob, {
    'uncrop.mode': 'ai.auto',
    removeBackground: 'true',
  });

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function addShadow(apiKey, blob, options = {}) {
  const { mode = 'auto', overrides = {} } = options;

  const fields = {
    'background.color': 'FFFFFF',
    outputSize: '2000x2000',
    padding: '0.15',
    'shadow.mode': 'ai.auto-with-overrides',
  };

  if (mode === 'custom') {
    fields['shadow.softnessOverride'] = String(overrides.softnessOverride);
    fields['shadow.intensityOverride'] = String(overrides.intensityOverride);
    fields['shadow.spreadOverride'] = overrides.spreadOverride;
    fields['shadow.directionOverride'] = overrides.directionOverride;
    fields['shadow.subjectPoseOverride'] = overrides.subjectPoseOverride;
  }

  const form = createEditForm(blob, fields);

  return fetchPhotoroom(EDIT_URL, apiKey, form, {
    'pr-ai-shadows-model-version': '2026-04-15',
  });
}

export async function adjustLighting(apiKey, blob) {
  const form = createEditForm(blob, {
    referenceBox: 'originalImage',
    maxWidth: '2000',
    maxHeight: '2000',
    removeBackground: 'false',
    'lighting.mode': 'ai.auto',
  });

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function expandImage(apiKey, blob, options = {}) {
  const { outputWidth, outputHeight } = options;

  const form = createEditForm(blob, {
    outputSize: `${outputWidth}x${outputHeight}`,
    referenceBox: 'originalImage',
    removeBackground: 'false',
    'expand.mode': 'ai.auto',
  });

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function createBackground(apiKey, blob, options = {}) {
  const { prompt = '', guidanceImage, guidanceScale = 0.6 } = options;

  const form = new FormData();
  form.append('imageFile', blob, 'image.png');
  form.append('referenceBox', 'originalImage');

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) {
    form.append('background.prompt', trimmedPrompt);
  }

  if (guidanceImage) {
    form.append(
      'background.guidance.imageFile',
      guidanceImage,
      guidanceImage.name || 'guidance.jpg'
    );
    form.append('background.guidance.scale', String(guidanceScale));
  }

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function catalogStudioImage(apiKey, blob) {
  const form = createEditForm(blob, {
    outputSize: '2000x2000',
    removeBackground: 'true',
    'background.color': 'FFFFFF',
    margin: '5%',
    'shadow.mode': 'ai.soft',
  });

  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

const LIFESTYLE_ENVIRONMENT_PROMPT =
  'Create a new photograph of the product with creative variations in a simple, neutral, living environment—a quiet café interior, an ordinary street, a plain room, or a similar everyday setting. Change the camera angle and viewpoint (for example, frontal to three-quarter or side view, high to low angle, wide to tight framing). Adjust composition and framing, and optionally vary the lighting or time of day (morning, golden hour, blue hour, overcast, or dramatic shadows). Try creative approaches such as closer product details, wider establishing shots, or alternative focal points while keeping the product as the clear hero and center of attention. Keep the environment subtle, realistic, and recognizable, with a consistent style and overall mood. The background should remain soft and unobtrusive, never competing with the product. Do not include people, hands, faces, silhouettes, animals, party decorations, or distracting foreground elements. Show the product from a different appealing angle within the same type of neutral ambient setting. The result should feel like a fresh, creative variation taken during the same shoot, offering a distinctly different perspective while maintaining scene continuity.';

const LIFESTYLE_IN_USE_PROMPT =
  'Create a professional lifestyle photoshoot where the provided product remains the absolute center of attention and the clear hero of the image. Highlight what is unique about the product, with the goal of advertising it and showing how it fits into everyday life. Set the lighting to create a natural, elegant atmosphere. Use excellent composition and a refined mood to achieve the look of high-end lifestyle photography. Include a human presence or a subtle interaction with the product to enhance authenticity and visual appeal, but keep the product visually dominant, sharp, and unobstructed as the main focal point.';

async function editWithAIImage(apiKey, blob, prompt, seed) {
  const fields = {
    removeBackground: 'false',
    'editWithAI.mode': 'ai.auto',
    'editWithAI.prompt': prompt,
  };

  if (seed != null) {
    fields['editWithAI.seed'] = String(seed);
  }

  const form = createEditForm(blob, fields);
  return fetchPhotoroom(EDIT_URL, apiKey, form);
}

export async function lifestyleEnvironmentImage(apiKey, blob) {
  return editWithAIImage(apiKey, blob, LIFESTYLE_ENVIRONMENT_PROMPT);
}

export async function lifestyleInUseImage(apiKey, blob) {
  return editWithAIImage(apiKey, blob, LIFESTYLE_IN_USE_PROMPT, 2016886668);
}

export const IMPROVEMENT_HANDLERS = {
  upscale: upscaleImage,
  uncrop: uncropImage,
  shadow: addShadow,
  lighting: adjustLighting,
  expand: expandImage,
  createBackground,
  catalogStudio: catalogStudioImage,
  lifestyleEnvironment: lifestyleEnvironmentImage,
  lifestyleInUse: lifestyleInUseImage,
};
