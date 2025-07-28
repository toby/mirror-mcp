# mirror-mcp

[![npm version](https://badge.fury.io/js/mirror-mcp.svg)](https://badge.fury.io/js/mirror-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides a `reflect` tool, enabling LLMs to engage in self-reflection and introspection through recursive questioning and MCP sampling.

## Overview

**mirror-mcp** allows AI models to "look at themselves" by providing a reflection mechanism. When an LLM uses the `reflect` tool, it can pose questions to itself and receive answers through the Model Context Protocol's sampling capabilities. This creates a powerful feedback loop for self-analysis, reasoning validation, and iterative problem-solving.

## Features

- 🪞 **Self-Reflection Tool**: Enables LLMs to ask themselves questions and receive computed responses
- 🔄 **MCP Sampling Integration**: Uses the Model Context Protocol's sampling mechanism for responses
- 📦 **npm Installable**: Easy installation and deployment
- ⚡ **Lightweight**: Minimal dependencies and fast startup
- 🔧 **Configurable**: Customizable reflection parameters and sampling options

## Installation

### Quick Install for VS Code

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mirror&config=%7B%22type%22%3A%20%22stdio%22%2C%20%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22mirror-mcp%40latest%22%5D%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=mirror&config=%7B%22type%22%3A%20%22stdio%22%2C%20%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22mirror-mcp%40latest%22%5D%7D&quality=insiders)

### MCP Host Configuration

For other MCP-compatible clients, add the following configuration:

```json
{
  "type": "stdio",
  "command": "npx", 
  "args": ["mirror-mcp@latest"]
}
```

### Via npm

```bash
npm install -g mirror-mcp
```

### Via npx (no installation required)

```bash
npx mirror-mcp
```

### From Source

```bash
git clone https://github.com/toby/mirror-mcp.git
cd mirror-mcp
npm install
npm run build
npm start
```




## Usage

### Using with VS Code Copilot

Once you've configured mirror-mcp with VS Code using the install badges above, you can use the reflect tool directly in Copilot Chat:

```
@workspace /reflect "What are the potential weaknesses in my reasoning about this React component?"
```

```
@workspace /reflect "How confident am I in my approach to handling this async operation?"
```

### Basic Configuration

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "mirror": {
      "command": "mirror-mcp",
      "args": []
    }
  }
}
```

### Using the Reflect Tool

Once configured, the LLM can use the `reflect` tool for basic self-reflection:

```
reflect: "What are the potential weaknesses in my reasoning about quantum computing?"
```

For more directed reflection, custom prompts can be used:

```
reflect: {
  "question": "How can I improve my problem-solving approach?",
  "system_prompt": "You are a strategic thinking mentor focused on systematic improvement",
  "user_prompt": "Provide 3 specific actionable recommendations with examples"
}
```

The tool will:
1. Accept the self-directed question and optional custom prompts
2. Use MCP sampling to generate a response (with system/user prompts if provided)
3. Return the tailored reflection back to the requesting model

### Advanced Configuration

```json
{
  "mcpServers": {
    "mirror": {
      "command": "mirror-mcp",
      "args": [
        "--max-tokens", "1000",
        "--temperature", "0.7",
        "--reflection-depth", "3"
      ]
    }
  }
}
```

## API Reference

### Tools

#### `reflect`

Enables the LLM to ask itself a question and receive a response through MCP sampling. The tool supports custom system and user prompts to help the LLM self-direct what kind of response it gets.

**Self-Direction with Custom Prompts:**
- **System Prompt**: Define the role or perspective for the reflection (e.g., "expert coach", "critical thinker", "creative problem solver")
- **User Prompt**: Specify the format, structure, or focus of the reflection response
- **Default Behavior**: When no custom prompts are provided, uses built-in reflection guidance focused on strengths, weaknesses, assumptions, and alternative perspectives

**Parameters:**
- `question` (string, required): The question the LLM wants to ask itself
- `context` (string, optional): Additional context for the reflection
- `system_prompt` (string, optional): Custom system prompt to direct the reflection approach
- `user_prompt` (string, optional): Custom user prompt to replace the default reflection instructions
- `max_tokens` (number, optional): Maximum tokens for the response (default: 500)
- `temperature` (number, optional): Sampling temperature (default: 0.8)

**Example:**
```json
{
  "name": "reflect",
  "arguments": {
    "question": "How confident am I in my previous analysis of the data?",
    "context": "Previous analysis showed a 23% increase in user engagement",
    "max_tokens": 300,
    "temperature": 0.6
  }
}
```

**Example with custom prompts:**
```json
{
  "name": "reflect",
  "arguments": {
    "question": "What are the potential weaknesses in my reasoning?",
    "system_prompt": "You are an expert critical thinking coach helping to identify logical fallacies and reasoning gaps.",
    "user_prompt": "Analyze my reasoning step-by-step and provide specific examples of potential weaknesses or blind spots.",
    "context": "Working on a complex machine learning model evaluation",
    "max_tokens": 400,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "reflection": "Upon reflection, my confidence in the 23% engagement increase analysis is moderate to high. The data sources appear reliable, and the methodology follows standard practices. However, I should consider potential confounding variables such as seasonal effects or concurrent marketing campaigns that might influence the results.",
  "metadata": {
    "tokens_used": 67,
    "reflection_time_ms": 1240
  }
}
```

## Architecture & Rationale

### Design Philosophy

**mirror-mcp** is built on the principle that self-reflection is crucial for robust AI reasoning. By enabling models to question their own outputs and reasoning processes, we create opportunities for:

- **Error Detection**: Models can identify potential flaws in their logic
- **Confidence Calibration**: Self-assessment helps gauge certainty levels
- **Iterative Improvement**: Reflective questioning can lead to better solutions
- **Metacognitive Awareness**: Understanding of the model's own reasoning process

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LLM Client    │───▶│   mirror-mcp    │───▶│  MCP Sampling   │
│                 │    │                 │    │   Infrastructure │
│ Calls reflect() │    │ Processes       │    │                 │
│                 │◀───│ reflection      │◀───│ Returns response│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Key Components

1. **Reflection Engine**: Processes incoming self-directed questions
2. **Sampling Interface**: Interfaces with MCP's sampling capabilities
3. **Context Manager**: Maintains conversation context for coherent reflections
4. **Response Formatter**: Structures reflection responses for optimal consumption

### Why MCP?

The [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol) provides a standardized way for AI models to connect with external resources and tools. By implementing mirror-mcp as an MCP server, we ensure:

- **Interoperability**: Works with any MCP-compatible client
- **Standardization**: Follows established protocols for tool integration
- **Scalability**: Can be deployed alongside other MCP servers
- **Future-Proofing**: Benefits from ongoing MCP ecosystem development

### Sampling Strategy

The reflection mechanism leverages MCP's sampling capabilities to generate thoughtful responses. The sampling process:

1. Takes the self-directed question as a prompt
2. Applies configurable sampling parameters (temperature, max tokens)
3. Generates a response using the underlying model
4. Returns the reflection with appropriate metadata

This approach ensures that reflections are generated using the same model capabilities as the original reasoning, creating authentic self-assessment.

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- TypeScript (for development)

### Development Setup

```bash
git clone https://github.com/toby/mirror-mcp.git
cd mirror-mcp
npm install
npm run dev
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas for Contribution

- Enhanced reflection strategies
- Additional sampling parameters
- Performance optimizations
- Documentation improvements
- Test coverage expansion

## Related Projects

- **[Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol)**: The foundational protocol specification
- **MCP Ecosystem**: Various other MCP servers and tools

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Model Context Protocol team for creating the foundational specification
- The broader AI research community working on metacognition and self-reflection
- Contributors and early adopters who help shape this tool

---

> *"The unexamined life is not worth living"* - Socrates
> 
> Enable your AI models to examine their own reasoning with mirror-mcp.
