import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import "./index.css";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import RecordsList from "./pages/RecordsList";
import RecordDetail from "./pages/RecordDetail";
import NewRecord from "./pages/NewRecord";
import EditRecord from "./pages/EditRecord";
import SearchPage from "./pages/SearchPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="records" element={<RecordsList />} />
            <Route path="records/new" element={<NewRecord />} />
            <Route path="records/:id" element={<RecordDetail />} />
            <Route path="records/:id/edit" element={<EditRecord />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
