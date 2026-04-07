export async function callOpenAI(
  prompt: string,
  model = "gpt-5-nano",
  maxTokens?: number,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const request = async (body: Record<string, unknown>) =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

  const baseBody = {
    model,
    messages: [{ role: "user" as const, content: prompt }],
  };

  let response = await request({
    ...baseBody,
    ...(maxTokens !== undefined && { max_completion_tokens: maxTokens }),
  });

  if (!response.ok && maxTokens !== undefined) {
    const firstErrorText = await response.text();

    // Some deployments still reject max_completion_tokens on chat completions.
    if (firstErrorText.includes("max_completion_tokens")) {
      response = await request({
        ...baseBody,
        max_tokens: maxTokens,
      });
    } else {
      throw new Error(
        `OpenAI API error (${response.status}): ${firstErrorText}`,
      );
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const content =
    typeof rawContent === "string"
      ? rawContent.trim()
      : Array.isArray(rawContent)
        ? rawContent
            .map((part: any) =>
              typeof part?.text === "string" ? part.text : "",
            )
            .join("")
            .trim()
        : "";

  if (!content) {
    throw new Error("No content in OpenAI response");
  }
  return content;
}
