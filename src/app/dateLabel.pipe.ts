import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateLabelStr' })
export class DateLabelStr implements PipeTransform {
  transform(value: string): string {
    let d = new Date();
    let curentYear = d.getFullYear();

    let requestDateStrt = new Date(value);
    let requestYear = requestDateStrt.getFullYear();

    let monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let newStr = monthList[requestDateStrt.getMonth()] + ' ' + requestDateStrt.getDate();

    if (curentYear != requestYear) {
      newStr += ", " + requestYear;
    }
    return newStr;
  }
}