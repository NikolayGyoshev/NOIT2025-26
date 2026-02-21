import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertRoom, type InsertReservation, type InsertReview } from "@shared/routes";
import { z } from "zod";

// ==========================================
// ROOMS HOOKS
// ==========================================

export function useRooms(filters?: { minPrice?: number; maxPrice?: number; capacity?: number; startDate?: string; endDate?: string }) {
  const queryKey = [api.rooms.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      let url = api.rooms.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
        if (filters.capacity) params.append("capacity", filters.capacity.toString());
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return api.rooms.list.responses[200].parse(await res.json());
    },
  });
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: [api.rooms.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.rooms.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch room");
      return api.rooms.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRoom) => {
      const validated = api.rooms.create.input.parse(data);
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create room");
      }
      return api.rooms.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertRoom>) => {
      const validated = api.rooms.update.input.parse(updates);
      const url = buildUrl(api.rooms.update.path, { id });
      const res = await fetch(url, {
        method: api.rooms.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update room");
      return api.rooms.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.rooms.delete.path, { id });
      const res = await fetch(url, {
        method: api.rooms.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete room");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    },
  });
}

// ==========================================
// RESERVATION HOOKS
// ==========================================

export function useReservations() {
  return useQuery({
    queryKey: [api.reservations.list.path],
    queryFn: async () => {
      const res = await fetch(api.reservations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reservations");
      return api.reservations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertReservation, "userId" | "totalPrice" | "status">) => {
      // Manually validate dates since they might come as Date objects or strings
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      const validated = api.reservations.create.input.parse(payload);

      // Debug log: show payload being sent
      // (check Browser Console -> Console tab)
      // eslint-disable-next-line no-console
      console.log("[debug] createReservation payload:", validated);

      const res = await fetch(api.reservations.create.path, {
        method: api.reservations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      // Debug log: inspect response status and body
      // eslint-disable-next-line no-console
      console.log("[debug] createReservation response status:", res.status);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // eslint-disable-next-line no-console
        console.log("[debug] createReservation response body:", text);
        const error = text ? JSON.parse(text) : {};
        throw new Error(error.message || "Failed to create reservation");
      }
      const json = await res.json();
      // eslint-disable-next-line no-console
      console.log("[debug] createReservation success:", json);
      return api.reservations.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reservations.cancel.path, { id });
      const res = await fetch(url, {
        method: api.reservations.cancel.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to cancel reservation");
      return api.reservations.cancel.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reservations.list.path] });
    },
  });
}

// ==========================================
// REVIEW HOOKS
// ==========================================

export function useReviews(roomId: number) {
  return useQuery({
    queryKey: [api.reviews.list.path, roomId],
    queryFn: async () => {
      const url = buildUrl(api.reviews.list.path, { id: roomId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return api.reviews.list.responses[200].parse(await res.json());
    },
    enabled: !!roomId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: number, data: Omit<InsertReview, "userId" | "roomId"> }) => {
      const url = buildUrl(api.reviews.create.path, { id: roomId });
      const validated = api.reviews.create.input.parse(data);
      const res = await fetch(url, {
        method: api.reviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to post review");
      return api.reviews.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reviews.list.path, variables.roomId] });
    },
  });
}
