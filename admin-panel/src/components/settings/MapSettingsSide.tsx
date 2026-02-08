import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { mapSettingsSchema, type MapSettingsFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { Label } from "@/components/elements/Label";

export const MapSettingsSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_MAP_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<MapSettingsFormValues>({
        resolver: zodResolver(mapSettingsSchema) as any,
        defaultValues: {
            provider: 'leaflet',
            google_maps_api_key: "",
            neshan_api_key: "",
            cedarmaps_api_key: "",
        },
    });

    const selectedProvider = watch("provider");

    const { data: settingsData, isLoading: isFetching } = useQuery({
        queryKey: ["map-settings"],
        queryFn: () => settingsApi.getMapSettings(),
        enabled: isOpen,
    });

    useEffect(() => {
        if (settingsData) {
            reset({
                provider: settingsData.provider,
                google_maps_api_key: settingsData.google_maps_api_key || "",
                neshan_api_key: settingsData.neshan_api_key || "",
                cedarmaps_api_key: settingsData.cedarmaps_api_key || "",
            });
        }
    }, [settingsData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: MapSettingsFormValues) => settingsApi.updateMapSettings(data),
        onSuccess: () => {
            showSuccess(msg.crud("updated", { item: "تنظیمات نقشه" }));
            queryClient.invalidateQueries({ queryKey: ["map-settings"] });
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: MapSettingsFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title="ویرایش تنظیمات نقشه"
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="map-settings-drawer-form"
            submitButtonText="بروزرسانی"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>سرویس‌دهنده نقشه</Label>
                    <select
                        {...register("provider")}
                        className="w-full h-12 px-4 rounded-xl border border-br bg-bg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="leaflet">Leaflet / OpenStreetMap (رایگان)</option>
                        <option value="google_maps">Google Maps</option>
                        <option value="neshan">نشان (نقشه ایرانی)</option>
                        <option value="cedarmaps">سیدار (نقشه ایرانی)</option>
                    </select>
                    {errors.provider && <p className="text-xs text-red-500">{errors.provider.message}</p>}
                </div>

                <div className="grid gap-5">
                    {selectedProvider === 'google_maps' && (
                        <FormFieldInput
                            label="Google Maps API Key"
                            id="google_maps_api_key"
                            error={errors.google_maps_api_key?.message}
                            placeholder="AIza..."
                            {...register("google_maps_api_key")}
                        />
                    )}

                    {selectedProvider === 'neshan' && (
                        <FormFieldInput
                            label="Neshan API Key"
                            id="neshan_api_key"
                            error={errors.neshan_api_key?.message}
                            placeholder="service.xxx..."
                            {...register("neshan_api_key")}
                        />
                    )}

                    {selectedProvider === 'cedarmaps' && (
                        <FormFieldInput
                            label="CedarMaps API Key"
                            id="cedarmaps_api_key"
                            error={errors.cedarmaps_api_key?.message}
                            placeholder="xxx..."
                            {...register("cedarmaps_api_key")}
                        />
                    )}
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[11px] text-font-s leading-relaxed">
                        تغییر سرویس نقشه بلافاصله در تمامی بخش‌های وب‌سایت (ثبت املاک، تماس با ما و ...) اعمال خواهد شد. برای نقشه‌های غیر رایگان، حتماً کلید API معتبر وارد کنید.
                    </p>
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
