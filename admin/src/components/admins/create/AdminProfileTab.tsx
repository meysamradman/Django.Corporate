"use client";

import { TabsContent } from "@/components/elements/Tabs";
import { Image } from "lucide-react";

export default function AdminProfileTab() {
  return (
    <TabsContent value="profile" className="mt-6">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium mb-4">اطلاعات پروفایل</h3>
          
          {/* Profile Picture Section */}
          <div className="space-y-4 mb-6">
            <h4 className="text-md font-medium">تصویر پروفایل</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Image className="mx-auto h-12 w-12" />
              </div>
              <button 
                type="button"
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                انتخاب تصویر
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium">نام (اختیاری)</label>
              <input
                id="first_name"
                name="first_name"
                placeholder="نام وارد کنید"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium">نام خانوادگی (اختیاری)</label>
              <input
                id="last_name"
                name="last_name"
                placeholder="نام خانوادگی وارد کنید"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium">بخش</label>
              <input
                id="department"
                name="department"
                placeholder="بخش وارد کنید (اختیاری)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="position" className="text-sm font-medium">سمت</label>
              <input
                id="position"
                name="position"
                placeholder="سمت وارد کنید (اختیاری)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}