"use client";

import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { Eye, FileText, PenLine, Plus, Trash2 } from "lucide-react";
import {
  tournamentStatus,
  type Tournament,
  usePartnerTournaments,
  partnerTournamentService,
  isPartnerTournamentId,
  useTournamentPages,
} from "@/entities/tournament";
import { useAuth } from "@/entities/user";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";
import { GlowButton } from "@/shared/ui/Button";

import { useAction } from "@/shared/hooks";
import { ActionError } from "@/shared/ui/ActionError";
import { Confirm } from "@/shared/ui/ConfirmDialog";
import { AdminFilters } from "@/features/filter-admin-data";
import { TournamentForm } from "@/features/manage-tournament";
import { TournamentPageEditor } from "@/features/edit-tournament-page";
export function TournamentsAdmin() {
  const store = usePlatformStore(),
    { busy, error, run } = useAction();
  const { user } = useAuth();
  const local = usePartnerTournaments();
  const pageContent = useTournamentPages();
  const tournaments = [...store.state.tournaments, ...local.tournaments];
  const [search, setSearch] = useState(""),
    [city, setCity] = useState("ALL"),
    [date, setDate] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Tournament | null>(null),
    [editing, setEditing] = useState<Tournament | null>(null),
    [pageEditing, setPageEditing] = useState<Tournament | null>(null),
    [confirm, setConfirm] = useState(false);
  const cities = [...new Set(tournaments.map((item) => item.city))],
    filtered = tournaments.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        (city === "ALL" || item.city === city) &&
        (!date || item.startAt.slice(0, 10) === date),
    );
  return (
    <>
      <AdminPageHeader
        title="ТУРНИРЫ"
        description="Создание и редактирование турниров; статус рассчитывается по датам. После создания ФИДЖИТАЛ-турнира откройте его и выберите «Страница турнира» для настройки блоков."
        actions={
          <GlowButton onClick={() => setCreate(true)}>
            <Plus /> Создать турнир
          </GlowButton>
        }
      />
      <AdminFilters
        search={search}
        setSearch={setSearch}
        onReset={() => {
          setSearch("");
          setCity("ALL");
          setDate("");
        }}
        extra={
          <>
            <select
              aria-label="Фильтр города"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="ALL">Все города</option>
              {cities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <input
              aria-label="Фильтр даты"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </>
        }
      />
      <DataTable
        headers={["Турнир", "Дата", "Город", "Статус", "Действия"]}
        rows={filtered.map((item) => [
          <span key="name">
            {item.name}
            {isPartnerTournamentId(item.id) && (
              <small className="partner-local-label">ОТ ПАРТНЕРОВ · локально</small>
            )}
          </span>,
          new Date(item.startAt).toLocaleString("ru-RU"),
          item.city,
          <Badge
            key="s"
            tone={
              tournamentStatus(item) === "completed"
                ? "red"
                : tournamentStatus(item) === "active"
                  ? "green"
                  : "blue"
            }
          >
            {tournamentStatus(item) === "completed"
              ? "Завершён"
              : tournamentStatus(item) === "active"
                ? "Идёт"
                : "Предстоящий"}
          </Badge>,
          <button
            className="icon-button"
            key="v"
            onClick={() => setSelected(item)}
            aria-label="Просмотреть"
          >
            <Eye />
          </button>,
        ])}
      />
      <ActionError message={error} />
      <ActionError message={local.error ?? ""} />
      <ActionError message={pageContent.error ?? ""} />
      {pageEditing && (
        <TournamentPageEditor
          key={pageEditing.id}
          tournament={pageEditing}
          content={pageContent.pages[pageEditing.id]}
          teams={store.state.teams}
          close={() => setPageEditing(null)}
        />
      )}
      {(create || editing) && (
        <TournamentForm
          tournament={editing}
          destination={editing && isPartnerTournamentId(editing.id) ? "PARTNER" : "PHYGITAL"}
          close={() => {
            setCreate(false);
            setEditing(null);
          }}
          save={(draft, destination) =>
            void run(
              "tournament-save",
              async () => {
                if (editing) {
                  const patch = {
                    name: draft.name,
                    shortDescription: draft.shortDescription,
                    description: draft.fullDescription?.trim() || draft.shortDescription,
                    city: draft.city,
                    startAt: draft.startAt,
                    endAt: draft.endAt ?? "",
                    imageName: draft.imageName,
                    imageUrl: draft.imageUrl,
                  };
                  if (isPartnerTournamentId(editing.id)) {
                    await partnerTournamentService.updateTournament(editing.id, patch, user);
                  } else {
                    await store.updateTournament(editing.id, patch);
                  }
                } else if (destination === "PARTNER") {
                  await partnerTournamentService.createTournament(draft, user);
                } else {
                  await store.createTournament(draft);
                }
              },
              editing ? "Турнир обновлён" : "Турнир создан",
            ).then((ok) => {
              if (!ok) return;
              setCreate(false);
              setEditing(null);
            })
          }
          busy={busy === "tournament-save"}
        />
      )}{" "}
      {selected && (
        <aside className="side-panel glass">
          <button onClick={() => setSelected(null)} aria-label="Закрыть">
            ×
          </button>
          <h2>{selected.name}</h2>
          <Badge>{selected.city}</Badge>
          <p>{selected.shortDescription}</p>
          <p>
            {new Date(selected.startAt).toLocaleString("ru-RU")}
            {selected.endAt ? ` — ${new Date(selected.endAt).toLocaleString("ru-RU")}` : ""}
          </p>
          <GlowButton
            onClick={() => {
              setEditing(selected);
              setSelected(null);
            }}
          >
            <PenLine /> Редактировать
          </GlowButton>
          {!isPartnerTournamentId(selected.id) && (
            <Button
              onClick={() => {
                setPageEditing(selected);
                setSelected(null);
              }}
            >
              <FileText /> Страница турнира
            </Button>
          )}
          <Button variant="danger" className="danger" onClick={() => setConfirm(true)}>
            <Trash2 /> Удалить турнир
          </Button>
        </aside>
      )}
      {confirm && selected && (
        <Confirm
          title="Удалить турнир?"
          text="Турнир исчезнет из списка и публичной части."
          close={() => setConfirm(false)}
          confirm={() =>
            void run(
              "delete-tournament",
              () =>
                isPartnerTournamentId(selected.id)
                  ? partnerTournamentService.deleteTournament(selected.id, user)
                  : store.deleteTournament(selected.id),
              "Турнир удалён",
            ).then((ok) => {
              if (!ok) return;
              setConfirm(false);
              setSelected(null);
            })
          }
          busy={busy === "delete-tournament"}
        />
      )}
    </>
  );
}
