/**
 * @typedef {"general" | "retail" | "fnb" | "pharmacy" | "service" | "rental" | "hotel"} RegistrationBusinessType
 * @typedef {"retail_pos" | "f_and_b" | "pharmacy" | "service_business" | "rental" | "hotel_booking"} RegistrationPluginPack
 */

/** @type {ReadonlyArray<{value: RegistrationBusinessType; label: string}>} */
export const REGISTRATION_BUSINESS_TYPES = Object.freeze([
  { value: "general", label: "ทั่วไป (General)" },
  { value: "retail", label: "ร้านค้าปลีก (Retail)" },
  { value: "fnb", label: "ร้านอาหาร/คาเฟ่ (F&B)" },
  { value: "pharmacy", label: "ร้านขายยา (Pharmacy)" },
  { value: "service", label: "ธุรกิจบริการ (Service)" },
  { value: "rental", label: "ธุรกิจเช่าระยะยาว (Rental)" },
  { value: "hotel", label: "ที่พัก/โรงแรม (Hotel)" },
]);

/** @type {Record<RegistrationBusinessType, RegistrationPluginPack | null>} */
const registrationPluginPacks = {
  general: null,
  retail: "retail_pos",
  fnb: "f_and_b",
  pharmacy: "pharmacy",
  service: "service_business",
  rental: "rental",
  hotel: "hotel_booking",
};

/** @param {unknown} value @returns {value is RegistrationBusinessType} */
export function isRegistrationBusinessType(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(registrationPluginPacks, value);
}

/** @param {RegistrationBusinessType} value */
export function getRegistrationPluginPack(value) {
  return registrationPluginPacks[value];
}
