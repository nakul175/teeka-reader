# Teeka Reader

Independent provider prototype for ASHA home visits. Provider organisation: **Raksha Immunisation Tools** (fictional).

Read printed card text and prepare a worker-verified vaccination history.

- Live private app: [Teeka Reader](https://teeka-reader.nakul1729233.chatgpt.site)
- Independent provider console: [Teeka Reader console](https://teeka-reader.nakul1729233.chatgpt.site/partners)
- GitHub source: [nakul175/teeka-reader](https://github.com/nakul175/teeka-reader)
- Saha customer: [Saha health workspace](https://saha-health-workspace.nakul1729233.chatgpt.site)

## Run locally

Use Node.js 22.13 or newer (Node 24 recommended). The app and service tests need no installed packages.

```sh
node build.mjs
node dev.mjs 5191
```

Open http://127.0.0.1:5191 . The local preview injects a fictional browser identity and uses an in-memory SQLite database. It is for local development; deploy `worker.mjs` through the Worker build, not the local preview server. Use another port when running several apps.

```sh
npm test
```

This builds the actual Worker handler and checks it against SQLite, including contract validation, referral rules, signatures, authentication, idempotency, replay and receipt lookup. Browser speech/OCR execution and clinical accuracy are separate, unverified checks.

## App and AI scope

**AI role:** Extract printed vaccination-card text; an ANM confirms doses and schedules. No automatic vaccine eligibility decision.

Model reference: https://github.com/tesseract-ocr/tesseract . Speech uses `onnx-community/whisper-tiny` through Transformers.js 3.5.2; printed document OCR uses Tesseract.js 5.1.1 LSTM. Independent apps offer English/Hindi model input. Models download on first use and run on the device. Workers review the text and enter observations separately. Referral prompts use explicit demonstration rules.

Synthetic evaluation only; `clinicalUse:false` in every result. There is no clinical approval, automatic clinical record update or prescribing. Signed receipts attest provider validation and rule processing; browser inference provenance is a client assertion. Manual/sample evidence does not claim AI inference. No real patient data belongs in this repository.

## Independent service

This app has its own source repository, private deployment, D1 receipt store, service credential and provider console. It can be maintained and deployed independently of Saha and the other seven apps. `config.json` defines its identity, observations, model role and fictional example.

| Route | Purpose |
| --- | --- |
| `/health` | Service health and app identity |
| `/api/manifest` | Provider scope and model role |
| `/api/openapi.json` | Service contract description |
| `POST /api/assess` | Validate confirmed synthetic observations and issue a signed result |
| `GET /api/receipts/:requestId` | Retrieve the same saved receipt, without repeating processing |
| `/api/ledger` | Private provider request ledger |

Contract: `frontline.v1`. A request contains only app ID, request ID, synthetic confirmation, reviewed observations and corrected text. Request ID is bound to customer and input hash in SQLite; reusing it with changed input returns 409. Unknown results remain uncertain and support receipt lookup. Raw images/audio are not sent to or retained by the provider.

## Hosting and Saha integration

The existing `.openai/hosting.json` identifies this app's Sites project; retain it. Build output goes in `dist/server/` with the Worker entry and Wrangler configuration. Sites supplies trusted browser authentication, private dispatch and a separate D1 binding named `DB`. Set `PARTNER_KEY` as a runtime secret; never commit it. Drizzle schema and its generated migration are under `db/` and `drizzle/`. Installing the optional development dependencies is needed only when regenerating migrations.

Saha holds this provider's exact origin, service key and private-dispatch token in server-only configuration. Saha checks normal care scope, current AI permission, confirmed synthetic visit and provider agreement, checkpoints before one call, verifies the signed receipt and requires worker review. The service customer is `saha-demo`; provider and Saha administration remain separate.

The GitHub repository is the independent product source. The existing Sites-managed Git repository remains the deployment source; pushing to GitHub alone does not redeploy the live app. Deployment must push the reviewed source to the existing Sites project and publish that exact source version.

## Source and evidence

- `worker.mjs`, `rules.mjs`: service, validation, explicit referral rules and HMAC receipts.
- `client/`: independent app and provider console, including browser model capture.
- `dev.mjs`, `build.mjs`: local preview and Worker build.
- `tests/service.mjs`, `tests/evidence/service.json`: reproducible synthetic service tests and recorded results.
- `.env.example`: empty secret template. Build output, dependencies, local databases and secrets are ignored.
