(function (root, factory) {
  const pairs = factory();
  if (typeof module === 'object' && module.exports) module.exports = pairs;
  if (root) root.AriCalmBenchmarkMockRoutePairs = pairs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function decodePolyline(value, precision = 6) {
    const geometry = [];
    const factor = 10 ** precision;
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < value.length) {
      const deltas = [];
      for (let coordinate = 0; coordinate < 2; coordinate += 1) {
        let result = 0;
        let shift = 0;
        let byte;
        do {
          byte = value.charCodeAt(index) - 63;
          index += 1;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        deltas.push((result & 1) ? ~(result >> 1) : result >> 1);
      }
      lat += deltas[0];
      lng += deltas[1];
      geometry.push([lat / factor, lng / factor]);
    }

    return geometry;
  }

  const rounds = [
    {
      pairId: 'calm-route-comparison-01',
      scenario: 'Three blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-1-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2188.454, durationSeconds: 1576, profile: 'foot_calm' },
          encoded: "uoplyA_e~hOX}@zN{{@rg@rXx@xAbC`AdBIhWtQzAvA}@rDhD`Cl@}Bfy@~ZzAfCmKvo@hFn@jBs@piAnJvgAjKlCdAhDSpRjAzSD?sAz@sBbe@iDTsCm@sAu@i@zADtI{HhD}EjNcP`Rfd@pO`YjK`T|G`Q|HjW`CrGl@cAmAuG]wDJyBp@aBpDyCzCk@dOjB`EaVvF`RhApGzH`XfDjItEvFvL]hObGnIzGdi@h[hCPnIhDh@wENjE|CnAx@hCfCWfC^vBv@tFnEtArBjBlIr@nB`A|AnAdAbCx@~DEbBPfJ`DhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        },
        calm_nature: {
          routeId: 'calm-round-1-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2028.208, durationSeconds: 1460, profile: 'foot_calm_v1' },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAlu@lYxF\\dP`KfFxEbBfElJlM`Qx]fF|HhMvIhB~C`F`CpL`@zIk@z@g@l@sB`Ee@d@v@t@T`AIjzAmd@dDaBbBmDdCdAhEmC|CUdJeFtFyBlFe@~CNzCn@`C_A`C_EpKrSbL|RhSzZtDa@xBh@fKvHj@NxAF|CYtEjE`\\zRpUt^bOlSfOw@`Gb@fJtHpIa@hDwAbB}AxAuBrBsEhCqLlAmDhGcLhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAdAtEdR}L~FcFjJaKtI{LbWic@"
        },
        human: {
          routeId: 'calm-round-1-human',
          source: 'human',
          metadata: { distanceMeters: 2252.633, durationSeconds: 1622, profile: 'manual' },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAlu@lYxF\\dP`KfFxEbBfElJlM`Qx]fF|HhMvIT`@rA|B{AfEa@lH|@w@v@CdL^fLCvKmAdLkCjFWpKv@bDGbDa@~KyClE|b@bEgA|Dr_@aCj@hAbJt@`GOxBxJnMtAyC|DaGhCC|Ivb@|^cMtDxVzOwD~@zRfArAfAbJ|Cge@v[~NpEtCnMdKjARjAIpDeBfF~ElHaKv_A|b@hC`@fTfAzLlG~H_@dE{GTwAv@mBhE_EhAaCrD}j@`EeJfNiP`A}@hAa@xNq@~TqKbO_EhB_AjHaHbHgFjEkEh@iAtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-02',
      scenario: 'Three blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-2-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 1381.154, durationSeconds: 994, profile: 'foot_calm' },
          encoded: "qa}jyAwblhOaFdCgE~@}a@tEaS|CqDXu@o@BhGt@~Jb@dKPfKIlCeBfEyDdGbClHu^nZ|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBhBbEI`H~Gzm@uMtEuQrIjDbRbZ|j@mCnE`CrEeY~c@iuA|rBaCpEjUpc@pAa@zElIw@lC~CrG~Vfd@{BnEe[be@I~Hy\\pf@yApEk@f@"
        },
        calm_nature: {
          routeId: 'calm-round-2-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1410.268, durationSeconds: 1015, profile: 'foot_calm_v1' },
          encoded: "qa}jyAwblhOsAv@`ApE|HvXvDnKzFlR{UrOpJ`e@}hApt@mItEwXbb@_SjXmSnUcFpHqEhIaE`Ja[||@kExJw@_AsNr[{ErH_F`LyClAsNnSo|@ttA}AoBcD_GdACzAb@Kh@cAScA|AvzAf|BzK`NhHvKkAnFtGjPhG~D`I~KF`EnDzAlUnRk@f@"
        },
        human: {
          routeId: 'calm-round-2-human',
          source: 'human',
          metadata: { distanceMeters: 1446.432, durationSeconds: 1041, profile: 'manual' },
          encoded: "qa}jyAwblhOsAv@`ApE|HvXvDnKu\\jToJnF_DjDePjXyHvNwBxCmLfKeDzB_EbEy@`CbClEdA~@zAjApDl@XrNwXbb@_SjXmSnUcFpHqEhIaE`J_HxRaRbi@eSpd@aNzXeh@v_AiTl_@_\\po@sApCsHdTxh@rt@~DgFt@n@xEzHrEcKtI}JbGfIv@Oh]xj@|AvErEoDtGjPhG~D`I~KF`EnDzAlUnRk@f@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-03',
      scenario: 'Three blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-3-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2152.284, durationSeconds: 1550, profile: 'foot_calm' },
          encoded: "uqfkyAokghOtHoEyAaDoCgKgSsm@vDyBcAmE}BwCiMyk@y@}ElgAmz@tB}@pDuCn@kAvN{KbCc@vL{FlrAwSfHkCrE}GzOo\\|DgFtEeDfFcBx@aHl`Aa@xDjAfIQhn@__@|L|i@Ch@lb@wTv]qUd[qP`AjDvbBa}@dKmE`D^tL}CpDzCxD~VxQmDdJnFlb@{LbQiKb@dCnCzAwBhELhBff@mb@pEsF`GoCbVyKbY}IxKi@bC\\~Bz@vBvAjBrBjFpIjD|KFxJbAvRtBxNtBXnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        calm_nature: {
          routeId: 'calm-round-3-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2036.808, durationSeconds: 1467, profile: 'foot_calm_v1' },
          encoded: "uqfkyAokghOvKaHnJ|c@~B?`hAkIlJeAtEiAzLkFbHeFx@}AfAmE~`@u\\dD\\~A_AvB`IvA}@|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBjC}HrDeFrKsExEuK`SsMlJoFfn@yb@pZwQnF{BnTmL`QqHb_@uLg@iGxJkBtCcItKkCnDRzL}DxEaAnIu@bWE~GgAtAiGnC{i@u@mNDuOh@yFC_G}AoKbEkEhGoLjCmMeAyJhAmCryA_x@hMaJ`Ab@hMoHrAIlk@gd@`DjKxBgBdAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        human: {
          routeId: 'calm-round-3-human',
          source: 'human',
          metadata: { distanceMeters: 2091.549, durationSeconds: 1506, profile: 'manual' },
          encoded: "uqfkyAokghOvKaHs@aEvWyOdJuGhBjEt@]xD~B|AxL~G{AGbGbKcDrDkAsDjAlSzLxDMbDb@nJpDdB[xBcAtBiD~G\\fAmE~`@u\\dD\\~A_AvB`IvA}@|HrZvIvFbClEdA~@zAjApDl@XrNlIuEfzAaaAnq@mc@hNuIlNwHhFe@lFcC``@_NdH}AhC`DjMiDGaFjBgDfuAok@pF~B`I[tFrArCaGnFuDnMeBnMNxIv@jWfF|o@~OpM`D~At@VuNr@wC|@uKf@uAv@sTjEye@UwBmDiNtEgCeQas@WcBfXeTxIcGzCiF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-04',
      scenario: 'Three blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-4-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2152.191, durationSeconds: 1550, profile: 'foot_calm' },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGdBjLhDx@~DsD|Ag@vB}A~G]fQqGUyQnCG\\rNxy@qDUoUtFGFfGfGe@~Vof@zm@qpAj@oDp@yHqFqIu^qg@bBsA`^_k@fjAmqBuUg`@tg@w|@g]sj@kCnEyB{E{BqGm]}g@fDqE~^on@bANjC}DKgDrf@sz@~AEtFaIdXaEa@eCL{A|FkA"
        },
        calm_nature: {
          routeId: 'calm-round-4-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1790.64, durationSeconds: 1289, profile: 'foot_calm_v1' },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDlC`AvBsH`c@c`AzBeD|FaB|BsB{A{Ez@cI~a@{s@nBmCdYsf@zGsK`IuOdMeSr@z@bA}@zDuGdBeEX{BjEqHpBw@rFeJjAuC_@eBPs@lm@mdApMoRdi@}s@kBeENgC~CoD_Uig@tOuWDqBa@eCL{A|FkA"
        },
        human: {
          routeId: 'calm-round-4-human',
          source: 'human',
          metadata: { distanceMeters: 1784.635, durationSeconds: 1285, profile: 'manual' },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDlC`AvBsH`c@c`AzBeD|FaB|BsB@\\}AyFz@cIsA_HqCkD{AkFeD}Xu@_KzSkc@nCwEfAuEv]au@dCeEhAqE|EiKvPq^zJoNjFkLpPm[xAmDfDqE~^on@bANjC}DKgDrf@sz@~AEtFaIdXaEa@eCL{A|FkA"
        }
      }
    }
  ];

  return rounds.map(round => {
    const routes = Object.fromEntries(
      Object.entries(round.routes).map(([routeType, route]) => [
        routeType,
        {
          routeId: route.routeId,
          routeType,
          source: route.source,
          metadata: route.metadata,
          geometry: decodePolyline(route.encoded)
        }
      ])
    );
    const referenceGeometry = routes.calm_quiet.geometry;
    const [originLat, originLng] = referenceGeometry[0];
    const [destinationLat, destinationLng] = referenceGeometry[referenceGeometry.length - 1];
    return {
      pairId: round.pairId,
      scenario: round.scenario,
      origin: { lat: originLat, lng: originLng, label: 'Start' },
      destination: { lat: destinationLat, lng: destinationLng, label: 'Destination' },
      routes
    };
  });
});
