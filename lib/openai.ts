export async function callOpenAI(
  prompt: string,
  model = "gpt-5-nano",
  maxTokens?: number,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API error:", await response.text());
    throw new Error("OpenAI API error");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No content in OpenAI response");
  }
  return content;
}
