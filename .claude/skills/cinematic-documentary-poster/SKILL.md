---
name: cinematic-documentary-poster
description: Creates detailed, production-ready image-generation prompts for cinematic historical documentary posters and Instagram carousel visuals, especially with Indonesian headlines.
---

# Cinematic Documentary Poster Generator

## Purpose
Turn a topic, claim, historical event, or short brief into a polished image-generation prompt for a cinematic documentary-style poster. The visual direction may resemble the user's reference: photorealistic film still, investigative atmosphere, archival props, dramatic lighting, and oversized Indonesian headline typography.

This skill writes prompts and art direction. Do not claim to have generated an image unless an image-generation tool is actually available and has been used.

## Workflow
1. Identify the central topic and the poster's intended message.
2. Separate verified historical facts from allegations, speculation, fiction, or conspiracy framing. Do not present an unverified claim as established fact.
3. Choose a visual metaphor that communicates the topic without inventing documentary evidence.
4. Compose the scene with a clear foreground subject, supporting background details, and a reserved area for headline typography.
5. Write the headline in natural Indonesian unless the user requests another language. Keep it concise, impactful, and faithful to the brief.
6. Produce a complete image prompt plus optional negative prompt and layout notes.
7. If key information is missing, make sensible creative choices rather than asking many questions. Ask one concise question only when the topic or intended claim is genuinely unclear.

## Default visual style
- Photorealistic, cinematic documentary still; premium editorial poster.
- Vertical composition, default aspect ratio 4:5 for Instagram feed. Use 9:16 for Stories/Reels when requested.
- Strong visual hierarchy: one main subject, one clear action or emotional beat, and a small number of meaningful props.
- Dramatic but plausible lighting; rich shadows; subtle film grain; realistic skin, materials, and period-appropriate objects.
- Investigative / archival atmosphere where relevant: folders, photographs, lab equipment, maps, files, newspaper clippings, analog monitors.
- Large, high-contrast headline near the lower third or in a clean negative-space area.
- Indonesian headline typography: bold condensed sans-serif, white for the lead-in and warm yellow/orange for emphasis, unless another palette is requested.
- Keep text legible, correctly spelled, and limited. Avoid fake logos, fabricated seals, or readable pseudo-documents.

## Accuracy and responsible framing
- Do not invent quotations, dates, named sources, official documents, institutional endorsements, or evidence.
- For disputed claims, use framing such as "dugaan", "kontroversi", "klaim", or "yang perlu diperiksa" where appropriate.
- Do not imply that a depicted person is a real historical individual unless the user has identified them and the depiction is appropriate. For sensitive historical subjects, prefer a generic fictionalized figure.
- Avoid sensationalizing real victims or depicting graphic violence.
- If the topic is fictional or alternate history, label it as fictional when needed.

## Output format
Unless the user asks for only a prompt, provide:

### 1. Konsep visual
One or two sentences describing the composition.

### 2. Headline poster
A short Indonesian headline, with optional subtitle. Preserve the user's intended meaning without overstating facts.

### 3. Main image prompt
Write one detailed, self-contained prompt suitable for a capable image generator. Include subject, setting, props, camera/composition, lighting, mood, typography placement, aspect ratio, and quality cues.

### 4. Negative prompt
List unwanted artifacts such as distorted hands, extra fingers, garbled text, watermark, logo, low resolution, cartoon style, clutter, duplicated faces, and implausible props.

### 5. Carousel continuation (optional)
If the user wants a carousel, propose 5–7 slides with a distinct visual beat and short headline per slide. Keep factual claims qualified and coherent across slides.

## Prompt construction template
Use this structure, adapting it to the topic:

"Create a premium photorealistic cinematic documentary poster about [TOPIC]. Scene: [SPECIFIC VISUAL SCENE]. Main subject: [SUBJECT AND ACTION]. Supporting details: [2–4 RELEVANT PROPS OR BACKGROUND CLUES]. Composition: vertical [4:5 or 9:16], clear foreground/background separation, subject in the upper half, uncluttered dark lower third reserved for headline. Lighting: [LIGHTING]. Mood: investigative, tense, historically grounded. Typography: exact Indonesian headline '[HEADLINE]', bold condensed sans-serif, very large, high contrast; use white for the opening phrase and warm yellow/orange for key words. Ensure the headline is spelled exactly and remains readable. Photorealistic materials, natural anatomy, cinematic color grading, subtle film grain, editorial quality. No fabricated official insignia or fake readable evidence."

## Interaction examples
- User: "Bikin poster tentang MK-Ultra."
  Respond with a historically careful concept and prompt. Distinguish the documented existence of the program from any specific unsupported allegation.
- User: "Buat carousel 7 slide tentang sebuah teori konspirasi."
  Treat it as a claim under examination; use qualified language and structure the slides as claim, context, evidence, counterpoints, and takeaway.
- User: "Cuma prompt, jangan penjelasan."
  Return only the finished image prompt and negative prompt.
