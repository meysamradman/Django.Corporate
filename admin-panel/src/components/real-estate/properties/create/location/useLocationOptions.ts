import { useEffect, useState } from "react";
import { realEstateApi } from "@/api/real-estate";

export function useLocationOptions(selectedProvinceId: number | null | undefined, selectedCityId: number | null | undefined) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [cityRegions, setCityRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const pData = await realEstateApi.getProvinces();
        setProvinces(pData || []);
        if (selectedProvinceId) {
          const cData = await realEstateApi.getProvinceCities(Number(selectedProvinceId));
          setCities(cData || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedCityId) {
      setCityRegions([]);
      return;
    }

    const loadCityRegions = async () => {
      try {
        const regionsData = await realEstateApi.getCityRegionsByCity(Number(selectedCityId));
        setCityRegions(regionsData || []);
      } catch (error) {
        setCityRegions([]);
      }
    };

    loadCityRegions();
  }, [selectedCityId]);

  const selectedCity = selectedCityId ? cities.find((city) => city.id === Number(selectedCityId)) : null;
  const selectedProvince = selectedProvinceId ? provinces.find((province) => province.id === Number(selectedProvinceId)) : null;

  return {
    provinces,
    setProvinces,
    cities,
    setCities,
    cityRegions,
    setCityRegions,
    loading,
    selectedCity,
    selectedProvince,
  };
}
