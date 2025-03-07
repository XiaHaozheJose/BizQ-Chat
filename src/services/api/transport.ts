import api from "./auth";
import {
  TransportResponse,
  Transport,
  TransportRequestBody,
} from "@/types/transport";

export const getTransports = async (): Promise<TransportResponse> => {
  const response = await api.get<TransportResponse>("/transfers");
  return response.data;
};

export const createTransport = async (
  transport: TransportRequestBody
): Promise<Transport> => {
  const response = await api.post<Transport>("/transfers", transport);
  return response.data;
};

export const updateTransport = async (
  transportId: string,
  transport: TransportRequestBody
): Promise<Transport> => {
  const response = await api.patch<Transport>(
    `/transfers/${transportId}`,
    transport
  );
  return response.data;
};

export const deleteTransport = async (transportId: string): Promise<void> => {
  await api.delete(`/transfers/${transportId}`);
};
