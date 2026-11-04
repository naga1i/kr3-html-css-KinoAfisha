// ===============================
// 1. Кнопка плавного возврата «Наверх»
// ===============================
const scrollTopButton = document.getElementById('scroll-top');
let pageScrollPosition = 0;

const lockPageScroll = () => {
  pageScrollPosition = window.scrollY;
  document.body.style.top = `-${pageScrollPosition}px`;
  document.body.classList.add('page--locked');
};

const unlockPageScroll = () => {
  document.body.classList.remove('page--locked');
  document.body.style.top = '';
  window.scrollTo({ top: pageScrollPosition, behavior: 'instant' });
};

if (scrollTopButton) {
  const updateScrollTopButton = () => {
    scrollTopButton.hidden = window.scrollY < 280;
  };

  window.addEventListener('scroll', updateScrollTopButton);
  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  updateScrollTopButton();
}

// ===============================
// 2. Модальное окно быстрого бронирования (index.html)
// ===============================
const quickBookingDialog = document.getElementById('quick-booking-dialog');
const quickBookButtons = document.querySelectorAll('.js-quick-book, #hero-buy-ticket-btn');
const closeDialogButton = document.getElementById('close-booking-dialog');
const closeDialogCross = document.getElementById('close-booking-dialog-cross');
const dialogMovieName = document.getElementById('dialog-movie-name');
const quickMovieSelect = document.getElementById('quick-movie');
const quickBookingForm = document.getElementById('quick-booking-form');
const successMessage = document.getElementById('success-message');

if (quickBookingDialog && quickBookingForm) {
  const openQuickBooking = (movieTitle) => {
    if (movieTitle && dialogMovieName) {
      dialogMovieName.textContent = `Вы выбрали: ${movieTitle}`;
    }
    if (movieTitle && quickMovieSelect) {
      const optionExists = Array.from(quickMovieSelect.options).some(
        (opt) => opt.value === movieTitle
      );
      if (optionExists) {
        quickMovieSelect.value = movieTitle;
      }
    }
    quickBookingDialog.showModal();
    lockPageScroll();
  };

  quickBookButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const movieTitle = button.dataset.movie || 'Рождение империи';
      openQuickBooking(movieTitle);
    });
  });

  if (quickMovieSelect && dialogMovieName) {
    quickMovieSelect.addEventListener('change', () => {
      dialogMovieName.textContent = `Вы выбрали: ${quickMovieSelect.value}`;
    });
  }

  if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => {
      quickBookingDialog.close();
    });
  }

  if (closeDialogCross) {
    closeDialogCross.addEventListener('click', () => {
      quickBookingDialog.close();
    });
  }

  quickBookingDialog.addEventListener('click', (event) => {
    if (event.target === quickBookingDialog) {
      quickBookingDialog.close();
    }
  });

  quickBookingDialog.addEventListener('close', unlockPageScroll);

  quickBookingForm.addEventListener('reset', () => {
    Array.from(quickBookingForm.elements).forEach((element) => {
      element.removeAttribute('aria-invalid');
    });
  });

  quickBookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formElements = Array.from(quickBookingForm.elements);
    formElements.forEach((element) => {
      if (element.willValidate) {
        element.removeAttribute('aria-invalid');
      }
    });

    if (!quickBookingForm.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });
      quickBookingForm.reportValidity();
      return;
    }

    if (successMessage) {
      successMessage.hidden = false;
    }

    quickBookingForm.reset();
    quickBookingDialog.close();
  });
}

// ===============================
// 3. Фильтрация фильмов на странице Афиши (afisha.html)
// ===============================
const afishaFilterForm = document.getElementById('afisha-filter-form');
const afishaCards = document.querySelectorAll('.js-afisha-card');
const afishaCountEl = document.getElementById('afisha-movies-count');
const afishaEmptyMessage = document.getElementById('afisha-empty-message');

if (afishaFilterForm && afishaCards.length > 0) {
  const applyAfishaFilters = () => {
    const selectedGenreInput = afishaFilterForm.querySelector('input[name="genre"]:checked');
    const selectedGenre = selectedGenreInput ? selectedGenreInput.value : 'all';

    const checkedAges = Array.from(
      afishaFilterForm.querySelectorAll('input[name="age"]:checked')
    ).map((checkbox) => checkbox.value);

    const badgeSelect = document.getElementById('filter-badge');
    const selectedBadge = badgeSelect ? badgeSelect.value : 'all';

    let visibleCount = 0;

    afishaCards.forEach((card) => {
      const cardGenre = card.dataset.genre || '';
      const cardAge = card.dataset.age || '';
      const cardBadge = card.dataset.badge || '';

      const matchesGenre = selectedGenre === 'all' || cardGenre === selectedGenre;
      const matchesAge = checkedAges.length === 0 || checkedAges.includes(cardAge);
      const matchesBadge = selectedBadge === 'all' || cardBadge === selectedBadge;

      const isVisible = matchesGenre && matchesAge && matchesBadge;
      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (afishaCountEl) {
      afishaCountEl.textContent = `Найдено фильмов: ${visibleCount} из ${afishaCards.length}`;
    }

    if (afishaEmptyMessage) {
      afishaEmptyMessage.hidden = visibleCount > 0;
    }
  };

  afishaFilterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyAfishaFilters();
  });

  afishaFilterForm.addEventListener('change', applyAfishaFilters);

  afishaFilterForm.addEventListener('reset', () => {
    setTimeout(applyAfishaFilters, 0);
  });

  applyAfishaFilters();
}

// ===============================
// 4. Страница бронирования и динамическая схема залов (booking.html)
// ===============================
const bookingPageForm = document.getElementById('booking-page-form');
const hallGrid = document.getElementById('hall-grid');

if (bookingPageForm && hallGrid) {
  const ticketPrices = {
    standard: 450,
    vip: 850,
    child: 300,
    student: 350,
  };

  const ticketTypeNames = {
    standard: 'Обычный (Стандарт)',
    vip: 'VIP (Реклайнер)',
    child: 'Детский (до 12 лет)',
    student: 'Студенческий',
  };

  // Индивидуальные конфигурации залов для каждого фильма
  const movieHallsConfig = {
    'Рождение империи': {
      hallName: 'Зал №1 (IMAX Laser)',
      screenLabel: 'Панорамный экран IMAX 24 м',
      rows: 5,
      seatsPerRow: 9,
      vipRows: [5],
      occupied: ['1-4', '1-5', '2-5', '2-6', '3-2', '3-3', '4-7', '4-8', '5-5'],
      defaultSelected: ['3-5', '3-6'],
    },
    'Битва моторов': {
      hallName: 'Зал №2 (Dolby Atmos)',
      screenLabel: 'Экран Dolby Atmos 18 м',
      rows: 5,
      seatsPerRow: 8,
      vipRows: [5],
      occupied: ['1-1', '1-2', '2-3', '2-4', '3-6', '3-7', '4-2', '5-3', '5-4'],
      defaultSelected: ['3-4', '3-5'],
    },
    'Барашек Шон и Чудище Лохматое': {
      hallName: 'Зал №3 (Семейный 3D)',
      screenLabel: 'Экран Семейного зала 14 м',
      rows: 4,
      seatsPerRow: 7,
      vipRows: [4],
      occupied: ['1-3', '1-4', '2-2', '2-5', '2-6', '3-1'],
      defaultSelected: ['2-3', '2-4'],
    },
    'Чудо-Юдо': {
      hallName: 'Зал №4 (Комфорт)',
      screenLabel: 'Экран зала Комфорт 16 м',
      rows: 5,
      seatsPerRow: 8,
      vipRows: [4, 5],
      occupied: ['1-5', '2-1', '2-2', '3-3', '3-4', '4-6', '4-7', '5-2'],
      defaultSelected: ['3-5', '3-6'],
    },
    'Большие гонки. Пегас III': {
      hallName: 'Зал №5 (Драйв Motion)',
      screenLabel: 'Экран Драйв-зала 17 м',
      rows: 4,
      seatsPerRow: 8,
      vipRows: [4],
      occupied: ['1-4', '1-5', '2-6', '2-7', '3-2', '3-3', '4-4', '4-5'],
      defaultSelected: ['2-4', '2-5'],
    },
    'Зверь': {
      hallName: 'Зал №6 (VIP Lounge)',
      screenLabel: 'Экран камерного VIP-зала 12 м',
      rows: 4,
      seatsPerRow: 6,
      vipRows: [1, 2, 3, 4],
      occupied: ['1-2', '1-3', '2-5', '3-1', '3-2', '4-4'],
      defaultSelected: ['2-3', '2-4'],
    },
    'Голодные игры: Рассвет жатвы': {
      hallName: 'Зал №1 (IMAX Laser • Предпродажа)',
      screenLabel: 'Панорамный экран IMAX 24 м',
      rows: 5,
      seatsPerRow: 9,
      vipRows: [5],
      occupied: ['2-4', '2-5', '3-4', '3-5', '3-6', '4-5', '5-4', '5-5'],
      defaultSelected: ['4-3', '4-4'],
    },
    'Чебурашка 3': {
      hallName: 'Зал №3 (Семейный • Предпродажа)',
      screenLabel: 'Экран Семейного зала 14 м',
      rows: 4,
      seatsPerRow: 7,
      vipRows: [4],
      occupied: ['1-2', '1-3', '2-4', '2-5', '3-2', '3-3', '4-4'],
      defaultSelected: ['3-4', '3-5'],
    },
  };

  const movieSelect = document.getElementById('booking-movie');
  const dateInput = document.getElementById('booking-date');
  const sessionSelect = document.getElementById('booking-session');
  const ticketCountInput = document.getElementById('booking-tickets-count');
  const seatTypeSelect = document.getElementById('booking-seat-type');
  const selectedSeatsInput = document.getElementById('booking-selected-seats');

  const hallTitleEl = document.getElementById('hall-title');
  const hallBadgeEl = document.getElementById('hall-badge');
  const hallScreenEl = document.getElementById('hall-screen');

  const summaryMovie = document.getElementById('summary-movie');
  const summaryHall = document.getElementById('summary-hall');
  const summarySession = document.getElementById('summary-session');
  const summaryTariff = document.getElementById('summary-tariff');
  const summarySeats = document.getElementById('summary-seats');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const bookingSuccessAlert = document.getElementById('booking-success-alert');

  // Подставляем фильм из URL-параметра ?movie=...
  const urlMovieParam = new URLSearchParams(window.location.search).get('movie');
  const movieSlugMap = {
    empire: 'Рождение империи',
    motors: 'Битва моторов',
    shaun: 'Барашек Шон и Чудище Лохматое',
    chudo: 'Чудо-Юдо',
    pegas: 'Большие гонки. Пегас III',
    beast: 'Зверь',
    hungergames: 'Голодные игры: Рассвет жатвы',
    cheburashka: 'Чебурашка 3',
  };

  if (urlMovieParam && movieSlugMap[urlMovieParam] && movieSelect) {
    movieSelect.value = movieSlugMap[urlMovieParam];
  }

  const getCurrentHallConfig = () => {
    const movieTitle = movieSelect ? movieSelect.value : 'Рождение империи';
    return movieHallsConfig[movieTitle] || movieHallsConfig['Рождение империи'];
  };

  const renderHallForCurrentMovie = () => {
    const config = getCurrentHallConfig();
    const totalSeats = config.rows * config.seatsPerRow;

    if (hallTitleEl) {
      hallTitleEl.textContent = `3. ${config.hallName} — выберите места`;
    }
    if (hallBadgeEl) {
      hallBadgeEl.textContent = `${config.rows} рядов • ${totalSeats} мест`;
    }
    if (hallScreenEl) {
      hallScreenEl.textContent = config.screenLabel;
    }

    hallGrid.innerHTML = '';

    for (let r = 1; r <= config.rows; r += 1) {
      const rowEl = document.createElement('div');
      rowEl.className = 'hall-row';

      const isVipRow = config.vipRows.includes(r);
      const labelEl = document.createElement('span');
      labelEl.className = 'hall-row__label';
      labelEl.textContent = isVipRow ? `Ряд ${r} VIP` : `Ряд ${r}`;
      rowEl.appendChild(labelEl);

      for (let s = 1; s <= config.seatsPerRow; s += 1) {
        const seatKey = `${r}-${s}`;
        const isOccupied = config.occupied.includes(seatKey);
        const isSelected = config.defaultSelected.includes(seatKey) && !isOccupied;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seat';
        if (isVipRow) {
          btn.classList.add('seat--vip');
        }
        if (isOccupied) {
          btn.classList.add('seat--occupied');
          btn.disabled = true;
        } else if (isSelected) {
          btn.classList.add('seat--selected');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.setAttribute('aria-pressed', 'false');
        }

        btn.dataset.row = String(r);
        btn.dataset.seat = String(s);
        btn.dataset.seatType = isVipRow ? 'vip' : 'standard';
        btn.textContent = String(s);
        btn.setAttribute(
          'aria-label',
          `Ряд ${r} Место ${s}${isVipRow ? ' VIP' : ''}${isOccupied ? ' занято' : ''}`
        );

        rowEl.appendChild(btn);
      }

      hallGrid.appendChild(rowEl);
    }

    // Если весь зал VIP (например, Зал №6 для фильма «Зверь»), автоматически ставим VIP-тариф
    if (seatTypeSelect) {
      if (config.vipRows.length === config.rows) {
        seatTypeSelect.value = 'vip';
      } else if (seatTypeSelect.value === 'vip') {
        seatTypeSelect.value = 'standard';
      }
    }

    if (ticketCountInput) {
      ticketCountInput.value = String(config.defaultSelected.length || 2);
    }
  };

  const getSelectedSeatButtons = () =>
    Array.from(hallGrid.querySelectorAll('.seat--selected'));

  const updateBookingSummary = () => {
    const config = getCurrentHallConfig();
    const selectedSeatButtons = getSelectedSeatButtons();
    const tariffKey = seatTypeSelect ? seatTypeSelect.value : 'standard';
    const basePrice = ticketPrices[tariffKey] || 450;

    const countFromInput = Math.max(1, parseInt(ticketCountInput.value, 10) || 1);
    const effectiveCount =
      selectedSeatButtons.length > 0 ? selectedSeatButtons.length : countFromInput;

    let total = 0;
    if (selectedSeatButtons.length > 0) {
      selectedSeatButtons.forEach((seatBtn) => {
        const isVipSeat = seatBtn.dataset.seatType === 'vip';
        if (isVipSeat && tariffKey === 'standard') {
          total += ticketPrices.vip;
        } else {
          total += basePrice;
        }
      });
    } else {
      total = effectiveCount * basePrice;
    }

    const seatLabels = selectedSeatButtons.map(
      (btn) => `Ряд ${btn.dataset.row}, Место ${btn.dataset.seat}`
    );

    if (selectedSeatsInput) {
      selectedSeatsInput.value = seatLabels.join('; ');
    }

    if (summaryMovie && movieSelect) {
      summaryMovie.textContent = movieSelect.value || 'Не выбран';
    }

    if (summaryHall) {
      summaryHall.textContent = config.hallName;
    }

    if (summarySession && dateInput && sessionSelect) {
      summarySession.textContent = `${dateInput.value}, ${sessionSelect.value}`;
    }

    if (summaryTariff) {
      summaryTariff.textContent = `${ticketTypeNames[tariffKey]} (${basePrice} руб.)`;
    }

    if (summarySeats) {
      summarySeats.textContent =
        seatLabels.length > 0
          ? `${seatLabels.join(', ')} (${seatLabels.length} шт.)`
          : `Места не отмечены на схеме (по форме: ${countFromInput} шт.)`;
    }

    if (summaryTotalPrice) {
      summaryTotalPrice.textContent = `${total} руб.`;
    }
  };

  // При смене фильма перерисовываем зал под этот фильм
  if (movieSelect) {
    movieSelect.addEventListener('change', () => {
      renderHallForCurrentMovie();
      updateBookingSummary();
    });
  }

  // Обработка кликов по местам в зале
  hallGrid.addEventListener('click', (event) => {
    const seatButton = event.target.closest('.seat');
    if (!seatButton || seatButton.disabled || seatButton.classList.contains('seat--occupied')) {
      return;
    }

    seatButton.classList.toggle('seat--selected');
    const isSelected = seatButton.classList.contains('seat--selected');
    seatButton.setAttribute('aria-pressed', String(isSelected));

    const selectedSeats = getSelectedSeatButtons();
    if (selectedSeats.length > 0 && ticketCountInput) {
      ticketCountInput.value = String(selectedSeats.length);
    }

    if (isSelected && seatButton.dataset.seatType === 'vip' && seatTypeSelect.value === 'standard') {
      seatTypeSelect.value = 'vip';
    }

    updateBookingSummary();
  });

  [dateInput, sessionSelect, ticketCountInput, seatTypeSelect].forEach((control) => {
    if (control) {
      control.addEventListener('change', updateBookingSummary);
      control.addEventListener('input', updateBookingSummary);
    }
  });

  bookingPageForm.addEventListener('reset', () => {
    setTimeout(() => {
      renderHallForCurrentMovie();
      Array.from(bookingPageForm.elements).forEach((el) => el.removeAttribute('aria-invalid'));
      updateBookingSummary();
    }, 0);
  });

  bookingPageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formElements = Array.from(bookingPageForm.elements);
    formElements.forEach((el) => {
      if (el.willValidate) {
        el.removeAttribute('aria-invalid');
      }
    });

    if (!bookingPageForm.checkValidity()) {
      formElements.forEach((el) => {
        if (el.willValidate && !el.checkValidity()) {
          el.setAttribute('aria-invalid', 'true');
        }
      });
      bookingPageForm.reportValidity();
      return;
    }

    if (bookingSuccessAlert) {
      bookingSuccessAlert.hidden = false;
      bookingSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  renderHallForCurrentMovie();
  updateBookingSummary();
}
