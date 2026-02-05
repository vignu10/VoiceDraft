require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Transcription endpoint
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  console.log('📝 Received transcription request');

  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const filePath = req.file.path;
  console.log(`📁 File saved to: ${filePath}`);

  try {
    // Read the file and create a stream for OpenAI
    const fileStream = fs.createReadStream(filePath);

    console.log('🎤 Calling OpenAI Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    console.log('✅ Transcription successful');
    console.log(`📄 Text: ${transcription.text.substring(0, 100)}...`);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      text: transcription.text,
      duration: transcription.duration || 0,
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('❌ Transcription error:', error.message);

    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      error: error.message || 'Transcription failed',
    });
  }
});

// Blog generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('📝 Received blog generation request');

  const { transcript, targetKeyword, tone, targetLength } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  // Validate transcript has meaningful content
  const trimmedTranscript = transcript.trim();
  const wordCount = trimmedTranscript.split(/\s+/).filter(w => w.length > 0).length;

  if (trimmedTranscript.length < 20) {
    console.log('❌ Transcript too short:', trimmedTranscript.length, 'chars');
    return res.status(400).json({ error: 'Transcript is too short. Please provide more content.' });
  }

  if (wordCount < 5) {
    console.log('❌ Not enough words:', wordCount);
    return res.status(400).json({ error: 'Not enough words detected. Please speak more content.' });
  }

  console.log(`📊 Transcript stats: ${wordCount} words, ${trimmedTranscript.length} characters`);

  const systemPrompt = `You are an expert SEO blog writer and content strategist. Your task is to transform a voice transcript into a polished, engaging, SEO-optimized blog post.

IMPORTANT INSTRUCTIONS:

1. ANALYZE THE TRANSCRIPT TONE:
   - Detect the natural speaking style, personality, and voice from the transcript
   - The user selected "${tone || 'professional'}" as their preferred tone, but ALSO incorporate the speaker's unique voice and personality from the transcript
   - Maintain any humor, enthusiasm, or personal anecdotes from the original speech
   - Keep the authentic feel while polishing the language

2. CONTENT STRUCTURE:
   - Target length: ${targetLength || '1000-1500 words'}
   - Create a compelling, click-worthy title (50-60 characters)
   - Write an engaging meta description (150-160 characters) that drives clicks
   - Use proper heading hierarchy (## for H2, ### for H3)
   - Start with a hook that captures attention
   - Break content into scannable sections with clear headings
   - Include bullet points or numbered lists for key takeaways
   - End with a strong conclusion and call-to-action

3. SEO OPTIMIZATION:
${targetKeyword ? `   - Primary keyword: "${targetKeyword}"
   - Include the keyword naturally in: title, meta description, first paragraph, at least one H2, and conclusion
   - Use semantic variations and related terms throughout` : '   - Optimize for the main topic naturally'}

4. QUALITY STANDARDS:
   - Transform spoken language into polished written content
   - Remove filler words, false starts, and verbal tics
   - Expand on ideas that were mentioned briefly
   - Add transitions between sections for flow
   - Ensure factual accuracy based on the transcript content

Return your response as valid JSON with this exact structure:
{
  "title": "Compelling SEO title here",
  "metaDescription": "Engaging meta description that drives clicks",
  "content": "Full markdown blog content with ## headings",
  "wordCount": 1234
}`;

  try {
    console.log('🤖 Calling OpenAI GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n\n${transcript}` },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Blog generation successful');
    console.log(`📄 Title: ${result.title}`);

    res.json(result);
  } catch (error) {
    console.error('❌ Generation error:', error.message);
    res.status(500).json({
      error: error.message || 'Blog generation failed',
    });
  }
});

// Section regeneration endpoint
app.post('/api/regenerate-section', async (req, res) => {
  console.log('📝 Received section regeneration request');

  const { draftId, sectionIndex, instruction, currentContent } = req.body;

  const systemPrompt = `You are an expert SEO blog writer. Rewrite the following section based on the instruction provided.
${instruction ? `Instruction: ${instruction}` : 'Improve the section while maintaining the same topic and style.'}

Return your response as JSON with this structure:
{
  "heading": "Section heading",
  "content": "Rewritten section content in markdown"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Current content:\n\n${currentContent || 'No content provided'}` },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Section regeneration successful');

    res.json(result);
  } catch (error) {
    console.error('❌ Regeneration error:', error.message);
    res.status(500).json({
      error: error.message || 'Section regeneration failed',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 VoiceDraft API Server');
  console.log('========================');
  console.log(`📡 Running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local network: http://192.168.29.236:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /api/health     - Health check`);
  console.log(`  POST /api/transcribe - Transcribe audio (Whisper)`);
  console.log(`  POST /api/generate   - Generate blog post (GPT-4)`);
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.error('⚠️  WARNING: OPENAI_API_KEY not set in .env file!');
  } else {
    console.log('✅ OpenAI API key configured');
  }
  console.log('');
});
