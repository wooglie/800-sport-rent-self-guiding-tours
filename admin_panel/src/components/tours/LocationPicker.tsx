import dynamic from "next/dynamic";

type LocationPickerProps = {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
};

export const LocationPicker = dynamic(
  () => import("./LocationPickerInner").then((m) => m.LocationPickerInner),
  { ssr: false }
) as React.ComponentType<LocationPickerProps>;
