"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/elements/card";
import {
    CheckCircle2,
    XCircle,
    Star,
    Zap,
    MapPin,
    Home,
    BedDouble,
    Bath,
    Maximize,
    Globe,
    Link as LinkIcon,
    Clock,
    DollarSign,
    Image as ImageIcon,
    Video,
    Music,
    FileText,
    Activity
} from "lucide-react";
import { TruncatedText } from "@/components/elements/custom/truncatedText";

export default function Detail() {

  return (
      <>


          <Card className="">

          <CardContent className="">

              <section className="flex flex-col gap-5">

                  <div className="flex justify-between gap-5">

                      <div className="">
                          <h1 className="">167 متر زمین تجاری مسکونی در حسن آباد</h1>
                      </div>
                      <div className="">
                          <h1 className="">167 متر زمین تجاری مسکونی در حسن آباد</h1>
                      </div>

                  </div>


                  <div className="flex justify-between gap-5">

                      <div className="">
                          <span className="text-xl">687,000,000</span>
                      </div>
                      <div className="">
                          <span className="text-xl">687,000,000</span>
                      </div>

                  </div>


              </section>


          </CardContent>

            </Card>

          <Card className="">

            <CardContent className="">

              <section className="flex flex-col gap-5">

                <div className="grid grid-cols-2 gap-5 space-y-0 border-b border-br">

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">نامک:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={"نامک"}
                                        maxLength={35}
                                        className="font-mono text-font-p text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">موقعیت:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={"نامک"}
                                        maxLength={35}
                                        className="text-font-p text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">موقعیت:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={"نامک"}
                                        maxLength={35}
                                        className="text-font-p text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">موقعیت:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={"نامک"}
                                        maxLength={35}
                                        className="text-font-p text-sm"
                                    />
                                </div>
                            </div>

                        </div>

              </section>


          </CardContent>

      </Card>
      </>
  );
}