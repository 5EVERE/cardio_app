'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробіжка ${new Intl.DateTimeFormat('ua-UA').format(
          this.date
        )}`)
      : (this.description = `Вело ${new Intl.DateTimeFormat('ua-UA').format(
          this.date
        )}`);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    this.pace = this.distance / (this.duration / 60);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleClimbField);

    containerWorkouts.addEventListener('click', this._moveToWorkOut.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Неможливо получити ваше місцезнаходження');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDuration.value =
      inputDistance.value =
      inputTemp.value =
      inputClimb.value =
        '';
    inputTemp.blur();
    inputClimb.blur();
    form.classList.add('hidden');
  }
  _toggleClimbField() {
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputDuration.value =
      inputDistance.value =
      inputTemp.value =
      inputClimb.value =
        '';
  }
  _newWorkout(e) {
    e.preventDefault();
    // Получити дані з форми
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));
    const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // Якщо пробіжка - Running

    if (type === 'running') {
      // Перевірити дані
      const temp = +inputTemp.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(temp)
        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert('Choose correct answer');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    // Якщо вело - Cycling

    if (type === 'cycling') {
      // Перевірити дані
      const climb = +inputClimb.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(climb)
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert('Choose correct answer');

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    // Добавити новий обєкт в масив

    this.#workouts.push(workout);

    // Відобразити на карті
    this._displayWorkout(workout);
    // Відобразити в списку
    this._displayWorkoutOnSidebar(workout);
    // Сховати форму
    this._hideForm();
  }

  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          closeOnClick: false,
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? 'Пробіжка 🏃' : 'Вело 🚵‍♂️'}`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
    <li class="workout workout--running" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃' : '🚵‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">хв</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.temp.toFixed(1)}</span>
            <span class="workout__unit">км/год</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟⏱</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">крок/хв</span>
          </div>
        </li>
        `;
    } else if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">км/год</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🏔</span>
            <span class="workout__value">${workout.climb.toFixed(1)}</span>
            <span class="workout__unit">м</span>
          </div>
        </li>
        `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkOut(e) {
    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;
    const workout = this.#workouts.find(
      item => item.id == workoutElement.dataset.id
    );
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
}

const app = new App();
