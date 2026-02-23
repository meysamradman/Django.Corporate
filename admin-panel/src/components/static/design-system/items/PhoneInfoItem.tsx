import { Phone } from "lucide-react";

export function PhoneInfoItem() {
  return (
    <div className="w-full max-w-120 rounded-xl border border-green bg-green-0 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-static-w text-green-2">
          <Phone className="size-4" />
        </div>

        <div className="text-right">
          <p className="text-xs text-font-s">شماره همراه</p>
          <p className="mt-1 text-base font-semibold text-font-p" dir="ltr">09124707989</p>
        </div>
      </div>
    </div>
  );
}
