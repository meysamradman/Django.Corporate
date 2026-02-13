import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSelect } from "@/components/shared/FormField";
import { mapSettingsSchema, type MapSettingsFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const MapSettingsSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_MAP_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const queryClient = useQueryClient();
    const neshanEnvMapKey = import.meta.env.VITE_NESHAN_MAP_KEY || "";

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors, isSubmitting },
    } = useForm<MapSettingsFormValues>({
        resolver: zodResolver(mapSettingsSchema) as any,
        defaultValues: {
            provider: 'leaflet',
            configs: {
                google_maps: { api_key: "", map_id: "" },
                neshan: { map_key: neshanEnvMapKey },
            }
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
                configs: {
                    google_maps: {
                        api_key: settingsData.configs?.google_maps?.api_key || "",
                        map_id: settingsData.configs?.google_maps?.map_id || "",
                    },
                    neshan: {
                        map_key: settingsData.configs?.neshan?.map_key || neshanEnvMapKey,
                    },
                }
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
                <Controller
                    name="provider"
                    control={control}
                    render={({ field }) => (
                        <FormFieldSelect
                            label="سرویس‌دهنده نقشه"
                            value={field.value}
                            onValueChange={field.onChange}
                            error={errors.provider?.message}
                            options={[
                                { label: "Leaflet / OpenStreetMap (رایگان)", value: "leaflet" },
                                { label: "Google Maps", value: "google_maps" },
                                { label: "Neshan (Iranian)", value: "neshan" },
                            ]}
                        />
                    )}
                />

                <div className="grid gap-5">
                    {selectedProvider === 'google_maps' && (
                        <>
                            <FormFieldInput
                                label="Google Maps API Key"
                                id="google_maps_api_key"
                                error={(errors.configs?.google_maps as any)?.api_key?.message}
                                placeholder="AIza..."
                                {...register("configs.google_maps.api_key")}
                            />
                            <FormFieldInput
                                label="Google Maps Map ID"
                                id="google_maps_map_id"
                                error={(errors.configs?.google_maps as any)?.map_id?.message}
                                placeholder="MAP_ID_FROM_GOOGLE_CONSOLE"
                                {...register("configs.google_maps.map_id")}
                            />
                        </>
                    )}

                    {selectedProvider === 'neshan' && (
                        <div className="space-y-2">
                            <FormFieldInput
                                label="Neshan Web Map Key"
                                id="neshan_map_key"
                                error={(errors.configs?.neshan as any)?.map_key?.message}
                                placeholder="web.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                {...register("configs.neshan.map_key")}
                            />
                            <p className="text-[11px] text-font-s">
                                اگر این فیلد خالی باشد یا وارد نکنید، مقدار `VITE_NESHAN_MAP_KEY` از env استفاده می‌شود.
                            </p>
                        </div>
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
