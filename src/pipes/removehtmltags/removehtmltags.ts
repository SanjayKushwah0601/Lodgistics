import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the RemovehtmltagsPipe pipe.
 *
 * See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
 * Angular Pipes.
 */
@Pipe({
  name: 'removehtmltags',
})
export class RemovehtmltagsPipe implements PipeTransform {

  transform(value: string) {
    if (value) {
      var result = value.replace(/<\/?[^>]+>/gi, ""); //removing html tag using regex pattern
      result = result.replace(/&nbsp;/gi, " ") // removing Non-Breaking SPace (NBSP)
      // result = this.replaceNbsps(result)
      return result;
    }
    else { }
  }

  replaceNbsps(str) {
    var re = new RegExp(String.fromCharCode(160), "g");
    return str.replace(re, " ");
  }
}
