import {
  ShopSettings,
  ReturnSetting,
  ShipmentSetting,
  NationalShipmentSetting,
  PickUpExpiredTime,
} from "@/types/shop-setting";
import api from "./auth";

export const getShopSettings = async (): Promise<ShopSettings> => {
  const response = await api.get<ShopSettings>("/shopSettings/");
  return response.data;
};

export const updateShopSettings = async (
  data: Partial<ShopSettings>
): Promise<ShopSettings> => {
  const response = await api.patch<ShopSettings>("/shopSettings", data);
  return response.data;
};

export const getReturnSettings = async (): Promise<ReturnSetting> => {
  const response = await api.get<{ returnSetting: ReturnSetting }>(
    "/shopSettings",
    {
      params: {
        properties: ["returnSetting"],
      },
    }
  );
  return response.data.returnSetting;
};

export const updateReturnSettings = async (
  settings: ReturnSetting
): Promise<ReturnSetting> => {
  const response = await api.patch("/shopSettings", {
    returnSetting: settings,
  });
  return response.data;
};

export const updateShipmentSettings = async (
  settings: ShipmentSetting,
  pickupExpiredTime: PickUpExpiredTime
): Promise<void> => {
  await api.patch("/shopSettings", {
    shipmentSetting: settings,
    pickUpExpiredTime: pickupExpiredTime,
  });
};

export const updateNationalShippingFeeSettings = async (
  feeSettings: NationalShipmentSetting
): Promise<void> => {
  await api.patch<void>("/shopSettings", {
    shipmentSetting: { national: feeSettings },
  });
};
