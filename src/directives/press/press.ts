import { Directive, ElementRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Gesture } from "ionic-angular/gestures/gesture";

@Directive({
  selector: '[long-press]'
})

export class PressDirective implements OnInit, OnDestroy {
  el: HTMLElement;
  pressGesture: Gesture;
  @Output('long-press') onPressRelease: EventEmitter<any> = new EventEmitter();

  constructor(el: ElementRef) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.pressGesture = new Gesture(this.el);
    this.pressGesture.listen();

    this.pressGesture.on('press', (event) => {
      this.onPressRelease.emit('released');
    });
  }

  ngOnDestroy() {
    this.pressGesture.destroy();
  }
}
