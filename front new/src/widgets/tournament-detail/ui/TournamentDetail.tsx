"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  UsersRound,
  ShieldCheck,
  Monitor,
  Activity,
  Trophy,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  ImageIcon,
} from "lucide-react";
import { usePlatformStore, usePlatformLoading } from "@/entities/platform";
import { useAuth } from "@/entities/user";
import {
  getTournamentPageDefaults,
  useTournamentPages,
  tournamentStatus,
  type Tournament,
  type TournamentPageContent,
} from "@/entities/tournament";
import type { Team } from "@/entities/team";
import type { TournamentApplication } from "@/entities/tournament-application";
import { useApp } from "@/shared/providers";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { RegisterTeamModal } from "@/features/register-team-for-tournament";
import { CreateTeamModal } from "@/features/create-team";
import { useAuthModal } from "@/features/auth";
import { NoTeamHelp } from "@/features/team-help";

const statusNames = { upcoming: "Предстоящий", active: "Идёт", completed: "Завершён" } as const;
const dateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export interface TournamentDetailPreview {
  tournament: Tournament;
  teams: Team[];
  applications: TournamentApplication[];
  content: TournamentPageContent;
}

export function TournamentDetail({
  id,
  preview,
}: {
  id: string;
  preview?: TournamentDetailPreview;
}) {
  const store = usePlatformStore();
  const { user } = useAuth();
  const loading = usePlatformLoading();
  const local = useTournamentPages();
  const { notify } = useApp();
  const { openAuth } = useAuthModal();
  const [applying, setApplying] = useState(false);
  const [allTeams, setAllTeams] = useState(false);
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);
  const tournament = preview
    ? preview.tournament
    : store.state.tournaments.find((item) => item.id === id);
  const teams = preview ? preview.teams : store.state.teams;
  const applications = preview ? preview.applications : store.state.tournamentApplications;
  if (!tournament)
    return (
      <section className="td-shell td-empty content-section" aria-live="polite">
        <Link href="/tournaments">Назад к турнирам</Link>
        <h1>{loading ? "Загружаем турнир…" : "Турнир пока недоступен"}</h1>
        {!loading && (
          <>
            <p>Проверьте ссылку или обновите данные страницы.</p>
            <Button onClick={() => window.location.reload()}>Обновить</Button>
          </>
        )}
      </section>
    );
  const content = preview
    ? preview.content
    : (local.pages[id] ?? getTournamentPageDefaults(tournament));
  const status = tournamentStatus(tournament);
  const registrations = [
    ...new Set(
      applications
        .filter((item) => item.tournamentId === tournament.id && item.status !== "REJECTED")
        .map((item) => item.teamId),
    ),
  ];
  const winner = teams.find((team) => team.id === content.winnerTeamId);
  const hasHistory = Boolean(content.historyText || content.gallery.length || content.winnerTeamId);
  const showPreviewTeam = (team: Team | null) => {
    setAllTeams(false);
    setPreviewTeam(team);
  };
  const teamList = (ids: string[]) => (
    <ul className="td-team-list">
      {ids.map((teamId) => {
        const team = teams.find((item) => item.id === teamId);
        return (
          <li key={teamId}>
            <UsersRound aria-hidden="true" />
            {preview ? (
              <Button
                type="button"
                className="td-preview-link"
                onClick={() => showPreviewTeam(team ?? null)}
                disabled={!team}
              >
                {team?.name ?? "Команда недоступна"}
              </Button>
            ) : (
              <Link href={`/teams?team=${encodeURIComponent(teamId)}`}>
                {team?.name ?? "Команда недоступна"}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <article className="td-shell">
      <Link className="td-back" href="/tournaments">
        <ChevronLeft aria-hidden="true" />
        Назад к турнирам
      </Link>
      {!preview && local.error && (
        <p className="form-error" role="alert">
          {local.error}
        </p>
      )}
      <header className="td-hero glass">
        {tournament.imageUrl && (
          <img className="td-cover" src={tournament.imageUrl} alt="" aria-hidden="true" />
        )}
        <div className="td-hero-copy">
          <Badge tone={status === "completed" ? "red" : status === "active" ? "green" : "blue"}>
            {statusNames[status]}
          </Badge>
          <h1>{tournament.name}</h1>
          <p className="td-lead">{tournament.shortDescription}</p>
          <div className="td-facts">
            <span>
              <CalendarDays aria-hidden="true" />
              {dateTime(tournament.startAt)}
              {tournament.endAt && <> — {dateTime(tournament.endAt)}</>}
            </span>
            <span>
              <MapPin aria-hidden="true" />
              {content.venue || "Площадка уточняется"}
            </span>
          </div>
          {status !== "completed" && (
            <Button variant="primary" onClick={() => setApplying(true)}>
              Зарегистрироваться
            </Button>
          )}
        </div>
        <div className="td-hero-object" aria-hidden="true">
          <div />
          <img src={content.visualUrl || "/page-objects/tournaments.webp"} alt="" />
        </div>
      </header>
      <dl className="td-summary glass">
        <div>
          <UsersRound aria-hidden="true" />
          <dt>В команде</dt>
          <dd>{content.teamSize}</dd>
        </div>
        <div>
          <ShieldCheck aria-hidden="true" />
          <dt>Количество команд</dt>
          <dd>{content.teamLimit}</dd>
        </div>
        <div>
          <Building2 aria-hidden="true" />
          <dt>Организаторы</dt>
          <dd>
            <a href={content.organizerUrl} target="_blank" rel="noopener noreferrer">
              {content.organizerName}
            </a>
          </dd>
        </div>
        <div className="td-disciplines">
          <dt>Дисциплины</dt>
          <dd>
            {content.disciplines.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </dd>
        </div>
      </dl>
      <section className="td-block td-about glass">
        <h2>О турнире</h2>
        <p className="td-prose">
          {content.about || "Подробная информация появится после публикации организатором."}
        </p>
      </section>
      <div className="td-content-grid">
        <div className="td-column">
          <section className="td-block td-stages glass">
            <h2>Как проходит турнир</h2>
            <ol>
              {[Monitor, Activity, Trophy].map((Icon, index) => (
                <li key={index}>
                  <Icon aria-hidden="true" />
                  <h3>{["Виртуальный этап", "Реальный этап", "Итоговый результат"][index]}</h3>
                  <p>{content.stages[index]}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="td-block td-teams glass">
            <div className="td-block-heading">
              <h2>Команды</h2>
              <span className="td-count">
                {registrations.length || preview || user ? registrations.length : "—"}
              </span>
            </div>
            <p className="td-muted">Зарегистрировано на турнир</p>
            {registrations.length ? (
              teamList(registrations.slice(0, 3))
            ) : (
              <p>
                {preview || user
                  ? "Зарегистрированных команд пока нет."
                  : "Войдите, чтобы посмотреть список зарегистрированных команд."}
              </p>
            )}
            {registrations.length > 3 && (
              <Button onClick={() => setAllTeams(true)}>
                Все команды ({registrations.length})
              </Button>
            )}
            <div className="td-help">
              <NoTeamHelp />
            </div>
          </section>
        </div>
        <div className="td-column">
          <section className="td-block td-rules glass">
            <h2>Правила участия</h2>
            <ul>
              {content.rules.map((rule, index) => (
                <li key={index}>
                  <Check aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <Link href="/rules">Ознакомиться с полным регламентом</Link>
          </section>
          {content.prize && (
            <section className="td-block td-prize glass">
              <h2>Приз</h2>
              <Trophy aria-hidden="true" />
              <p className="td-prose">{content.prize}</p>
            </section>
          )}
        </div>
      </div>
      {hasHistory && (
        <section className="td-block td-history glass">
          <h2>Как это было</h2>
          <div
            className={
              content.gallery.length > 0 && (content.historyText || content.winnerTeamId)
                ? "td-recap-grid"
                : "td-recap-single"
            }
          >
            {content.gallery.length > 0 && (
              <TournamentGallery key={JSON.stringify(content.gallery)} images={content.gallery} />
            )}
            {(content.historyText || content.winnerTeamId) && (
              <div className="td-recap-copy">
                {content.historyText && <p className="td-prose">{content.historyText}</p>}
                {content.winnerTeamId && (
                  <div className="td-winner">
                    <Trophy aria-hidden="true" />
                    <div>
                      <span>Победитель турнира</span>
                      {winner ? (
                        preview ? (
                          <Button
                            type="button"
                            className="td-preview-link"
                            onClick={() => showPreviewTeam(winner)}
                          >
                            {winner.name}
                          </Button>
                        ) : (
                          <Link href={`/teams?team=${encodeURIComponent(winner.id)}`}>
                            {winner.name}
                          </Link>
                        )
                      ) : (
                        <p>Команда-победитель сейчас недоступна</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      {allTeams && (
        <Modal
          title={`Команды турнира · ${registrations.length}`}
          onClose={() => setAllTeams(false)}
        >
          {teamList(registrations)}
          <Button onClick={() => setAllTeams(false)}>Закрыть</Button>
        </Modal>
      )}
      {previewTeam && preview && (
        <Modal
          title={previewTeam.name}
          subtitle="Демонстрационный состав команды"
          onClose={() => setPreviewTeam(null)}
        >
          <ul className="td-team-list">
            {previewTeam.members.map((member) => (
              <li key={member.id}>
                <UsersRound aria-hidden="true" />
                <span>
                  {member.name}
                  {member.captain ? " · Капитан" : ""}
                </span>
              </li>
            ))}
          </ul>
          {!previewTeam.members.length && <p>Игроки пока не добавлены.</p>}
          <Button type="button" onClick={() => setPreviewTeam(null)}>
            Закрыть
          </Button>
        </Modal>
      )}
      {applying && preview && (
        <Modal title="Демонстрация регистрации" onClose={() => setApplying(false)}>
          <p>
            Это пример страницы турнира. В демонстрационном режиме заявки не отправляются, а
            авторизация не требуется.
          </p>
          <Button type="button" onClick={() => setApplying(false)}>
            Понятно
          </Button>
        </Modal>
      )}
      {applying && !preview && (
        <RegisterTeamModal
          tournament={tournament}
          close={() => setApplying(false)}
          onLogin={() => openAuth("login", `/tournaments/${encodeURIComponent(id)}`)}
          renderCreateTeam={(close, create) => <CreateTeamModal close={close} create={create} />}
          success={() => {
            setApplying(false);
            notify("Заявка отправлена. Изменения команды заблокированы до завершения турнира.");
          }}
        />
      )}
    </article>
  );
}

function TournamentGallery({ images }: { images: { url: string; alt: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState(false);
  const move = (step: number) => {
    setCurrent((value) => (value + step + images.length) % images.length);
    setFailed(false);
  };
  return (
    <div className="td-gallery" aria-label="Галерея турнира">
      <div className="td-gallery-frame">
        {failed ? (
          <div className="td-gallery-error">
            <ImageIcon />
            <p>Изображение недоступно</p>
          </div>
        ) : (
          <img
            src={images[current].url}
            alt={images[current].alt || `Фото турнира ${current + 1}`}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="td-gallery-controls">
        <Button aria-label="Предыдущее фото" disabled={images.length < 2} onClick={() => move(-1)}>
          <ChevronLeft />
        </Button>
        <span aria-live="polite">
          {current + 1} / {images.length}
        </span>
        <Button aria-label="Следующее фото" disabled={images.length < 2} onClick={() => move(1)}>
          <ChevronRight />
        </Button>
      </div>
      {images.length > 1 && (
        <div className="td-gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrent(index);
                setFailed(false);
              }}
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === current}
            >
              <img src={image.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
