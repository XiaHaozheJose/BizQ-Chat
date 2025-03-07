import {
  CreateShipmentRequest,
  CreateShipmentResponse,
  ShipmentsResponse,
  Shipment,
} from "@/types/shipments";
import { ShipmentDetailStatus } from "@/types";
import api from "./auth";

// 创建发货单
export const createShipment = async (
  data: CreateShipmentRequest
): Promise<CreateShipmentResponse> => {
  const response = await api.post<CreateShipmentResponse>("/shipments/", data);
  return response.data;
};

// 获取发货单列表
export const fetchShipments = async (
  params: any
): Promise<ShipmentsResponse> => {
  const response = await api.get<ShipmentsResponse>("shipments/", {
    params,
  });
  return response.data;
};

// 获取发货单详情
export const getShipmentDetail = async (
  shipmentId: string
): Promise<Shipment> => {
  const response = await api.get<{ shipment: Shipment }>(
    `shipments/${shipmentId}`
  );
  return response.data.shipment;
};

// 更新发货单状态
export const updateShipmentStatus = async (
  shipmentId: string,
  status: ShipmentDetailStatus
): Promise<void> => {
  await api.patch(`/shipments/${shipmentId}/status`, { status });
};

// 取消发货单
export const cancelShipment = async (shipmentId: string): Promise<void> => {
  await api.delete(`/shipments/${shipmentId}`);
};
