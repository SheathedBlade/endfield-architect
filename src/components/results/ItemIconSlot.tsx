import type { FC } from "react";

interface ItemIconSlotProps {
  itemId: string;
  size?: "sm" | "lg";
  className?: string;
}

export const ItemIconSlot: FC<ItemIconSlotProps> = ({
  itemId,
  size = "sm",
  className = "",
}) => {
  const sizeClass = size === "lg" ? "item-icon-lg" : "item-icon-sm";

  return (
    <span
      className={`item-icon-slot ${sizeClass} ${className}`}
      aria-hidden="true"
      title={itemId}
    />
  );
};
