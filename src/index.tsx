import { CloudflareVectorizeStore, CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare"
import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception'
import { OpenAI } from "langchain/llms/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RetrievalQAChain } from "langchain/chains"

import Template from './template'

type Bindings = {
	AI: any;
	OPENAI_API_KEY: string;
	VECTORIZE_INDEX: any;
}

const app = new Hono<{ Bindings: Bindings }>()

app.post("/add", async c => {
	const embeddings = new CloudflareWorkersAIEmbeddings({
		binding: c.env.AI,
		modelName: "@cf/baai/bge-base-en-v1.5",
	})

	const store = new CloudflareVectorizeStore(embeddings, {
		index: c.env.VECTORIZE_INDEX
	})

	const body = await c.req.json()
	const { id, text } = body

	const splitter = new RecursiveCharacterTextSplitter()
	const splitDocuments = await splitter.createDocuments(text)

	const ids = splitDocuments.map(_ => id)

	await store.addDocuments(splitDocuments, { ids })

	return c.text("Not found", { status: 404 })
})

app.post("/query", async c => {
	if (!c.env.OPENAI_API_KEY) {
		throw new HTTPException(500, { message: "OPENAI_API_KEY not set" })
	}

	const body = await c.req.json()
	const query = body.query || "Hello World"

	const embeddings = new CloudflareWorkersAIEmbeddings({
		binding: c.env.AI,
		modelName: "@cf/baai/bge-base-en-v1.5",
	})

	const store = new CloudflareVectorizeStore(embeddings, {
		index: c.env.VECTORIZE_INDEX
	})

	const storeRetriever = store.asRetriever()

	const model = new OpenAI({
		openAIApiKey: c.env.OPENAI_API_KEY
	})

	const chain = RetrievalQAChain.fromLLM(model, storeRetriever)

	const res = await chain.call({ query })

	return c.json(res)
})

app.get("/", c => {
	const errors = {}
	if (!c.env.OPENAI_API_KEY) {
		errors["api_key"] = true
	}

	return c.html(<Template errors={errors} />)
})

export default app
