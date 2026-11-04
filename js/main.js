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
      const movieTitle = button.dataset.movie || 'Дюна: Хроники Арракиса';
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
// 4. Страница бронирования и схема зала (booking.html)
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

  const movieSelect = document.getElementById('booking-movie');
  const dateInput = document.getElementById('booking-date');
  const sessionSelect = document.getElementById('booking-session');
  const ticketCountInput = document.getElementById('booking-tickets-count');
  const seatTypeSelect = document.getElementById('booking-seat-type');
  const selectedSeatsInput = document.getElementById('booking-selected-seats');

  const summaryMovie = document.getElementById('summary-movie');
  const summarySession = document.getElementById('summary-session');
  const summaryTariff = document.getElementById('summary-tariff');
  const summarySeats = document.getElementById('summary-seats');
  const summaryTotalPrice = document.getElementById('summary-total-price');
  const bookingSuccessAlert = document.getElementById('booking-success-alert');

  // Подставляем фильм из URL-параметра ?movie=...
  const urlMovieParam = new URLSearchParams(window.location.search).get('movie');
  const movieSlugMap = {
    dune: 'Дюна: Хроники Арракиса',
    tokyo: 'Ночной рубеж: Токио',
    forest: 'Хранители звёздного леса',
    horizon: 'Горизонт событий',
    lighthouse: 'Тайна старого маяка',
    symphony: 'Последний симфонический концерт',
    mars: 'Марсианский экспресс 2099',
    shadow: 'Тень над Северным морем',
  };

  if (urlMovieParam && movieSlugMap[urlMovieParam] && movieSelect) {
    movieSelect.value = movieSlugMap[urlMovieParam];
  }

  const getSelectedSeatButtons = () =>
    Array.from(hallGrid.querySelectorAll('.seat--selected'));

  const updateBookingSummary = () => {
    const selectedSeatButtons = getSelectedSeatButtons();
    const tariffKey = seatTypeSelect ? seatTypeSelect.value : 'standard';
    const basePrice = ticketPrices[tariffKey] || 450;

    // Если выбраны места на схеме, считаем по ним; иначе по полю количества билетов
    const countFromInput = Math.max(1, parseInt(ticketCountInput.value, 10) || 1);
    const effectiveCount =
      selectedSeatButtons.length > 0 ? selectedSeatButtons.length : countFromInput;

    // Для каждого выбранного места учитываем VIP-ряд или выбранный тариф
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

    // Если выбрано место VIP-ряда, переключаем селект типа места на VIP, если стоял обычный
    if (isSelected && seatButton.dataset.seatType === 'vip' && seatTypeSelect.value === 'standard') {
      seatTypeSelect.value = 'vip';
    }

    updateBookingSummary();
  });

  [movieSelect, dateInput, sessionSelect, ticketCountInput, seatTypeSelect].forEach((control) => {
    if (control) {
      control.addEventListener('change', updateBookingSummary);
      control.addEventListener('input', updateBookingSummary);
    }
  });

  bookingPageForm.addEventListener('reset', () => {
    getSelectedSeatButtons().forEach((btn) => {
      btn.classList.remove('seat--selected');
      btn.setAttribute('aria-pressed', 'false');
    });
    Array.from(bookingPageForm.elements).forEach((el) => el.removeAttribute('aria-invalid'));
    setTimeout(updateBookingSummary, 0);
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

  updateBookingSummary();
}
