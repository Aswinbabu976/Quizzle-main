const AIProvider = require('./provider');
const OpenAI = require('openai');

class DeepSeekProvider extends AIProvider {
    constructor(config = {}) {
        super(config);
        
        this.apiKey = config.apiKey || 'sk-W1-USnL7wriORUOMuTO1qg';
        this.baseUrl = config.baseUrl || 'https://litellm.alilabs.route64.de/v1';
        this.model = config.model || 'deepseek/deepseek-v3.2';

        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseUrl
        });
    }

    async *generateStream(options = {}) {
        const systemPrompt = this.getSystemPrompt(options);
        const userPrompt = this.getUserPrompt(options);

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.7
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }

    async listModels() {
        return [
            'deepseek/deepseek-v3.2'
        ];
    }
}

module.exports = DeepSeekProvider;