export const config = { maxDuration: 60 };

import {
  IMAGE_MODEL,
  sanitizeApiKey,
  json,
  readJsonBody,
  startMistralImageConversation,
  restartMistralImageFromReference,
} from '../lib/mistral-core.js';

const CHROMA = '#00FF00';

function summarizePlan(plan) {
  if (!plan) return '';
  const layers = Array.isArray(plan.layers)
    ? plan.layers.map((layer) => `${layer.name} (${layer.role}): ${layer.traits?.map((t) => t.name).join(', ')}`).join('\n')
    : '';
  return [
    `Collection: ${plan.collectionName || ''}`,
    `Subject: ${plan.subject || ''}`,
    `Style: ${plan.styleLabel || ''}`,
    `Art direction: ${plan.artDirection || ''}`,
    `Composition: ${plan.compositionGuide || ''}`,
    `Layers:\n${layers}`,
  ].join('\n');
}

function buildImagePrompt({ task, prompt, plan, layer, trait }) {
  const core = `USER CONCEPT: ${prompt}\n\n${summarizePlan(plan)}\n\n`;
  const globalRules = `\n\nGLOBAL RULES:\n- Follow the user concept exactly. Never replace the requested subject with another mascot, skull, robot, animal, or preset.\n- Square 1:1 composition.\n- No text, logos, captions, borders, signatures, or watermarks.\n- Keep exactly the visual language and composition described by the plan.\n- Production artwork for a layered generative NFT collection.`;

  if (task === 'master') {
    return `${core}GENERATE A NEW IMAGE using the image_generation tool. Create the CANONICAL MASTER CHARACTER/OBJECT reference for this collection.\nUse base trait: ${trait?.name || 'canonical base'}.\nShow one clear centered subject matching "${plan?.subject || prompt}". Keep a fixed pose, scale, camera angle, proportions, silhouette and framing that future edits can preserve. Do not add distinctive headwear, accessories, effects, foreground props, or scenery.\nBACKGROUND REQUIREMENT: entire background must be a perfectly flat uniform chroma green ${CHROMA}. No gradient, shadow, floor, horizon, texture or objects in the green background. Never use this exact chroma green inside the subject.${globalRules}`;
  }

  if (task === 'background') {
    return `${core}GENERATE A NEW IMAGE using the image_generation tool. Generate ONLY the full-canvas BACKGROUND trait named "${trait?.name}". No main subject, character silhouette, foreground character, or text. Make it visually rich but leave the center readable for the collection subject.${globalRules}`;
  }

  if (task === 'base-variant') {
    return `EDIT THE REFERENCE IMAGE from the prior conversation state using image_generation. Preserve the exact pose, framing, scale, camera, silhouette, composition, lighting direction and art style. Change ONLY the intrinsic BASE appearance so it clearly becomes "${trait?.name}". Do not add headwear, accessories, effects or scenery.\nBACKGROUND REQUIREMENT: preserve a perfectly flat uniform chroma green ${CHROMA}. Do not use that exact green in the subject.${globalRules}`;
  }

  return `EDIT THE REFERENCE IMAGE from the prior conversation state using image_generation. Preserve the exact subject identity, pose, scale, camera, proportions, composition, base colors and art style. Change or add ONLY this single trait:\nLAYER: ${layer?.name || ''}\nROLE: ${layer?.role || ''}\nTRAIT: ${trait?.name || ''}\nDo not modify unrelated parts of the subject. Do not add scenery or text.\nBACKGROUND REQUIREMENT: preserve a perfectly flat uniform chroma green ${CHROMA}. Do not use that exact green inside the requested trait.${globalRules}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  const apiKey = sanitizeApiKey(process.env.MISTRAL_API_KEY);
  if (!apiKey) return json(res, 500, { error: 'Missing MISTRAL_API_KEY in Vercel Environment Variables.' });

  try {
    const body = await readJsonBody(req);
    const task = String(body.task || '').trim();
    const prompt = String(body.prompt || '').trim();
    const plan = body.plan;
    const layer = body.layer || null;
    const trait = body.trait || null;
    const referenceConversationId = String(body.referenceConversationId || '').trim();
    const referenceEntryId = String(body.referenceEntryId || '').trim();

    if (!prompt || !plan || !task) return json(res, 400, { error: 'task, prompt, and plan are required.' });
    if (task !== 'master' && task !== 'background' && (!referenceConversationId || !referenceEntryId)) {
      return json(res, 400, { error: `A Mistral master conversation reference is required for ${task}.` });
    }

    const imagePrompt = buildImagePrompt({ task, prompt, plan, layer, trait });
    const result = (task === 'master' || task === 'background')
      ? await startMistralImageConversation(apiKey, imagePrompt)
      : await restartMistralImageFromReference(apiKey, {
          conversationId: referenceConversationId,
          entryId: referenceEntryId,
          prompt: imagePrompt,
        });

    return json(res, 200, {
      image: result.image,
      mimeType: result.mimeType,
      model: IMAGE_MODEL,
      provider: 'Mistral Image Generation',
      task,
      chroma: CHROMA,
      conversationId: result.conversationId,
      entryId: result.entryId,
      fileId: result.fileId,
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    const retryAfterMs = Math.max(0, Number(error?.retryAfterMs || 0));
    const message = error?.code === 'TIMEOUT'
      ? 'Mistral Image request timed out.'
      : String(error?.message || 'Unknown image-generation error.');
    console.error('[GLITCH Mistral image error]', error);
    return json(res, status || 502, {
      error: message.slice(0, 420),
      retryAfterMs,
      provider: 'Mistral Image Generation',
    }, retryAfterMs ? { 'Retry-After': Math.ceil(retryAfterMs / 1000) } : {});
  }
}
