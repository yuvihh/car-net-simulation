import type 移动单位类 from "@/移动单位/移动单位/移动单位";

export class 设备类 {
  constructor(单位: 移动单位类) {
    this._移动单位 = 单位;
    单位.添加设备(this);
  }
  
  protected _移动单位: 移动单位类;
  
  get 移动单位(): 移动单位类 {
    return this._移动单位;
  }
}