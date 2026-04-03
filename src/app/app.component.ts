import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExplorerComponent } from './explorer/explorer.component';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, ExplorerComponent],
})
export class AppComponent {
  title = 'amplify-angular-template';
}
