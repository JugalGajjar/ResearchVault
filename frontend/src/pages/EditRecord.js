import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRecord, updateRecord } from "../api";
import RecordForm from "../components/records/RecordForm";

export default function EditRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery(["record", id], () => getRecord(id), { select: (r) => r.data });

  const mutation = useMutation((data) => updateRecord(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(["record", id]);
      queryClient.invalidateQueries("records");
      navigate(`/records/${id}`);
    },
  });

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><span className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8, fontSize: "12px", color: "var(--text-muted)" }}>
          <Link to="/records" style={{ color: "var(--text-muted)" }}>Records</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link to={`/records/${id}`} style={{ color: "var(--text-muted)" }}>{record?.title?.slice(0, 40)}...</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span>Edit</span>
        </div>
        <h2>Edit Record</h2>
      </div>

      <div className="card">
        {mutation.isError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>Failed to update record.</div>
        )}
        <RecordForm
          initialData={record}
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isLoading}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
