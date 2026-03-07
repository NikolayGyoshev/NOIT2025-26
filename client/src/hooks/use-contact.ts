import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useCreateContactMessage() {
  return useMutation({
    mutationFn: async (data: { name: string; email: string; subject: string; message: string }) => {
      const validated = api.contact.create.input.parse(data);
      const res = await fetch(api.contact.create.path, {
        method: api.contact.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send message");
      }
      return api.contact.create.responses[201].parse(await res.json());
    },
  });
}

export function useContactMessages() {
  return useQuery({
    queryKey: [api.contact.list.path],
    queryFn: async () => {
      const res = await fetch(api.contact.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.contact.list.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
}

export function useContactMessagesByEmail(email?: string) {
  return useQuery({
    queryKey: [api.contact.byEmail.path, email],
    queryFn: async () => {
      const params = new URLSearchParams({ email: email || "" });
      const res = await fetch(`${api.contact.byEmail.path}?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch replies");
      return api.contact.byEmail.responses[200].parse(await res.json());
    },
    enabled: !!email,
  });
}

export function useReplyContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, replyMessage }: { id: number; replyMessage: string }) => {
      const url = api.contact.reply.path.replace(":id", String(id));
      const validated = api.contact.reply.input.parse({ replyMessage });
      const res = await fetch(url, {
        method: api.contact.reply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send reply");
      }
      return api.contact.reply.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contact.list.path] });
    },
  });
}
