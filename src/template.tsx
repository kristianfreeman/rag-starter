import { html } from 'hono/html'

type Props = {
  errors: {
    api_key?: boolean
  }
}

const Template = ({ errors }: Props) => {
  const template = html`
    <html>
      <head>
        <script src="https://unpkg.com/htmx.org/dist/htmx.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
        <script src="https://unpkg.com/htmx.org/dist/ext/json-enc.js"></script>
        <script src="https://unpkg.com/htmx.org/dist/ext/client-side-templates.js"></script>
        <script src="https://unpkg.com/mustache@latest"></script>

        <style>
          #errors {
            color: red;
            visibility: ${Object.keys(errors).length ? "visible" : "hidden"};
          }

          #results {
            margin-top: 1em;
          }

          form {
            display: flex;

            bottom: 0;
            position: absolute;

            max-width: 800px;
            width: 100%;

            input { flex: 1; }
          }
        </style>
      </head>
      <body>
        <h1>RAG Starter</h1>

        <div id="errors">
          ${errors.api_key && html`<li>OPENAI_API_KEY is not set</li>`}
        </div>

        <div id="results">
        </div>

        <form 
          hx-ext="json-enc, client-side-templates" 
          hx-on::after-request="reset()"
          hx-post="/query" 
          hx-swap="innerHTML" 
          hx-target="#results" 
          mustache-template="response"
        >
          <input 
            autofocus="true"
            id="query" 
            name="query" 
            placeholder="Query" 
            required 
            type="text" 
          />
          <button type="submit">Submit</button>
        </form>

        <template id="response">
          <p>{{text}}</p>
        </template>
      </body>

      <script>
        const reset = () => {
          const input = document.getElementById("query")
          input.value = ""
          input.focus()
        }
      </script>
    </html>
  `

  return template;
}

export default Template