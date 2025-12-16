# fleet-tracking-system

iot-fleet-system/
├── k8s/                     # Kubernetes Manifestleri
│   ├── 00-postgres.yaml
│   ├── 01-redis.yaml
│   ├── 02-ingestion.yaml
│   ├── 03-worker.yaml
│   ├── 04-api.yaml
│   └── 05-frontend.yaml
├── database/                # SQL Scriptleri
│   └── init.sql
├── ingestion-service/       # Go - Veri Alımı (Redis Fallback burada)
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
├── worker-service/          # Go - Veriyi işle ve DB'ye yaz
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
├── realtime-api/            # Node.js - Socket.io ve Chat
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
└── frontend/                # React
    ├── src/
    └── Dockerfile