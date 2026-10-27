"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

/** Los mapas se cargan solo en cliente (MapLibre necesita window/WebGL). */
const MapLoading = () => <Skeleton className="h-full w-full rounded-none" />;

export const ZonePickerMap = dynamic(() => import("./ZonePickerMap"), { ssr: false, loading: MapLoading });
export const ProMap = dynamic(() => import("./ProMap"), { ssr: false, loading: MapLoading });
export const AdminMap = dynamic(() => import("@/components/admin/AdminMap"), { ssr: false, loading: MapLoading });
