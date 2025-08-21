import { Component } from '@angular/core';
import { TitleComponent } from "../../../components/shared/title/title.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [TitleComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  titleValue="Settings";

}
