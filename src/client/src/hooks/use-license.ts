import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { licenseHasFeature, type FeatureKey } from "@shared/license";

export function useLicenseStatus() {
  return useQuery({
    queryKey: ["license", "status"],
    queryFn: () => api.getLicenseStatus(),
  });
}

export function useLicense() {
  const query = useLicenseStatus();
  const features = query.data?.features ?? [];

  function hasFeature(feature: FeatureKey): boolean {
    return licenseHasFeature(features, feature);
  }

  return {
    ...query,
    features,
    hasFeature
  };
}

export function useActivateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (licenseKey: string) => api.activateLicense(licenseKey),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["license"] });
    },
  });
}

export function useDeactivateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deactivateLicense(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["license"] });
    },
  });
}
