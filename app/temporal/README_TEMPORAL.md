
# Temporal State Page

Add a route to render `TemporalState` page, for example with React Router:

```tsx
import TemporalState from "./temporal/TemporalState";
<Route path="/temporal" element={<TemporalState />} />
```

The page expects the API to be available under `/api/temporal/...`.
