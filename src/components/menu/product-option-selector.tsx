"use client";

import { useMemo, useState } from "react";

import { useMounted } from "@/hooks/use-mounted";
import { useCartStore, type CartOption } from "@/stores/cartStore";
import type { MenuOption, MenuOptionGroup, MenuProduct } from "@/types/menu";

type ProductOptionSelectorProps = {
  groupedOptions: MenuOptionGroup[];
  product: MenuProduct;
};

type SelectedOptions = Record<string, number[]>;
type OptionCounts = Record<number, number>;
type SelectedOptionItem = {
  count: number;
  groupName: string;
  option: MenuOption;
};

const requiredIceGroupName = "얼음 선택";
const optionalShotGroupName = "샷 추가";
const defaultIceOptionName = "각얼음";

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("ko-KR");
}

function getOptionPrice(option: MenuOption) {
  return Number(option.opt_price);
}

function getCartOptions(selectedOptionItems: SelectedOptionItem[]): CartOption[] {
  return selectedOptionItems.map((item) => ({
    count: item.count,
    opt_nm: item.option.opt_nm,
    opt_no: item.option.opt_no,
    opt_price: getOptionPrice(item.option),
    opt_type: item.groupName,
  }));
}

function getOptionMaxCount(option: MenuOption) {
  return Number(option.opt_max_cnt ?? 0);
}

function isCounterOption(option: MenuOption) {
  return getOptionMaxCount(option) > 1;
}

function isRequiredGroup(group: MenuOptionGroup) {
  return group.opt_type === requiredIceGroupName;
}

function isShotGroup(group: MenuOptionGroup) {
  const normalizedGroupName = group.opt_type.replace(/\s+/g, "").toLowerCase();

  return (
    group.opt_type === optionalShotGroupName ||
    normalizedGroupName.includes("샷") ||
    normalizedGroupName.includes("shot")
  );
}

function isSingleChoiceGroup(group: MenuOptionGroup) {
  return isRequiredGroup(group) || isShotGroup(group);
}

function getDefaultSelectedOptions(groupedOptions: MenuOptionGroup[], isProductSoldOut: boolean) {
  if (isProductSoldOut) {
    return {};
  }

  return groupedOptions.reduce<SelectedOptions>((defaults, group) => {
    if (!isRequiredGroup(group)) {
      return defaults;
    }

    const defaultOption = group.options.find(
      (option) =>
        !isCounterOption(option) &&
        option.opt_nm === defaultIceOptionName &&
        option.soldout_fl !== "y",
    );

    if (!defaultOption) {
      return defaults;
    }

    return {
      ...defaults,
      [group.opt_type]: [defaultOption.opt_no],
    };
  }, {});
}

function getSelectedOptionItems(
  groupedOptions: MenuOptionGroup[],
  selectedOptions: SelectedOptions,
  optionCounts: OptionCounts,
): SelectedOptionItem[] {
  return groupedOptions.flatMap((group) => {
    const selectedOptNos = selectedOptions[group.opt_type] ?? [];

    return group.options.flatMap((option) => {
      if (isCounterOption(option)) {
        const count = optionCounts[option.opt_no] ?? 0;

        return count > 0 ? [{ count, groupName: group.opt_type, option }] : [];
      }

      return selectedOptNos.includes(option.opt_no)
        ? [{ count: 1, groupName: group.opt_type, option }]
        : [];
    });
  });
}

function getSelectableRequiredOptions(group: MenuOptionGroup) {
  return group.options.filter((option) => !isCounterOption(option));
}

function isGroupComplete(group: MenuOptionGroup, selectedOptions: SelectedOptions) {
  if (!isRequiredGroup(group)) {
    return true;
  }

  const selectedOptNos = selectedOptions[group.opt_type] ?? [];

  return getSelectableRequiredOptions(group).some((option) =>
    selectedOptNos.includes(option.opt_no),
  );
}

function getGroupBadgeLabel(group: MenuOptionGroup) {
  if (isRequiredGroup(group)) {
    return "필수";
  }

  if (isShotGroup(group)) {
    return "선택 가능";
  }

  return "선택";
}

function getGroupBadgeClassName(group: MenuOptionGroup) {
  if (isRequiredGroup(group)) {
    return "rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white";
  }

  return "rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600";
}

function getOptionControlLabel(group: MenuOptionGroup, option: MenuOption) {
  if (isCounterOption(option)) {
    return "수량 선택 옵션";
  }

  return isSingleChoiceGroup(group) ? "단일 선택 옵션" : "복수 선택 옵션";
}

function getOptionAmountLabel(option: MenuOption) {
  const price = getOptionPrice(option);

  return price > 0 ? `+${formatPrice(price)}원` : "기본";
}

function getChoiceCardClassName({
  disabled,
  isSelected,
}: {
  disabled: boolean;
  isSelected: boolean;
}) {
  if (isSelected) {
    return "border-neutral-950 bg-neutral-950 text-white shadow-sm";
  }

  if (disabled) {
    return "border-neutral-100 bg-neutral-50 text-neutral-400";
  }

  return "border-neutral-200 bg-white text-neutral-950";
}

function ChoiceIndicator({
  isSelected,
  variant,
}: {
  isSelected: boolean;
  variant: "radio" | "checkbox";
}) {
  return (
    <span
      className={
        variant === "radio"
          ? isSelected
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white bg-white"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white"
          : isSelected
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white bg-white"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white"
      }
      aria-hidden="true"
    >
      {variant === "radio" ? (
        <span
          className={
            isSelected ? "h-2.5 w-2.5 rounded-full bg-neutral-950" : "h-2.5 w-2.5 rounded-full"
          }
        />
      ) : isSelected ? (
        <span className="text-xs font-bold leading-none text-neutral-950">✓</span>
      ) : null}
    </span>
  );
}

function CounterOptionRow({
  count,
  disabled,
  group,
  option,
  updateCount,
}: {
  count: number;
  disabled: boolean;
  group: MenuOptionGroup;
  option: MenuOption;
  updateCount: (group: MenuOptionGroup, option: MenuOption, nextCount: number) => void;
}) {
  const maxCount = getOptionMaxCount(option);
  const isOptionSoldOut = option.soldout_fl === "y";
  const isMinusDisabled = disabled || count <= 0;
  const isPlusDisabled = disabled || count >= maxCount;

  return (
    <div
      className={
        count > 0
          ? "flex w-full items-center justify-between gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-4 text-left text-sm text-neutral-950 last:border-b-0"
          : "flex w-full items-center justify-between gap-4 border-b border-neutral-100 bg-white px-4 py-4 text-left text-sm text-neutral-950 last:border-b-0"
      }
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={
            count > 0
              ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950"
              : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white"
          }
          aria-hidden="true"
        >
          {count > 0 ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{option.opt_nm}</span>
          <span className="sr-only">{getOptionControlLabel(group, option)}</span>
          {option.opt_en_nm ? (
            <span className="mt-1 block truncate text-xs text-neutral-500">
              {option.opt_en_nm}
            </span>
          ) : null}
          <span className="mt-1 inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
            최대 {maxCount}개
          </span>
        </span>
      </span>

      <span className="shrink-0 text-right">
        {isOptionSoldOut ? (
          <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
            품절
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-neutral-950">
            {getOptionAmountLabel(option)}
          </span>
        )}
        <span className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-semibold text-neutral-950 transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-300"
            disabled={isMinusDisabled}
            onClick={() => updateCount(group, option, count - 1)}
          >
            -
          </button>
          <span className="min-w-8 rounded-full bg-white px-2.5 py-1 text-center text-sm font-semibold text-neutral-950">
            {count}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-semibold text-neutral-950 transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-300"
            disabled={isPlusDisabled}
            onClick={() => updateCount(group, option, count + 1)}
          >
            +
          </button>
        </span>
      </span>
    </div>
  );
}

function SelectOptionButton({
  disabled,
  group,
  isSelected,
  option,
  toggleOption,
}: {
  disabled: boolean;
  group: MenuOptionGroup;
  isSelected: boolean;
  option: MenuOption;
  toggleOption: (group: MenuOptionGroup, option: MenuOption) => void;
}) {
  const isOptionSoldOut = option.soldout_fl === "y";
  const variant = isSingleChoiceGroup(group) ? "radio" : "checkbox";

  return (
    <button
      type="button"
      className={
        "flex w-full items-stretch justify-between gap-4 border-b border-neutral-100 px-4 py-4 text-left text-sm transition duration-200 ease-out active:scale-[0.99] last:border-b-0 " +
        getChoiceCardClassName({ disabled, isSelected })
      }
      disabled={disabled}
      onClick={() => toggleOption(group, option)}
    >
      <span className="flex min-w-0 items-start gap-3">
        <ChoiceIndicator isSelected={isSelected} variant={variant} />
        <span className="min-w-0">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{option.opt_nm}</span>
            <span className="sr-only">{getOptionControlLabel(group, option)}</span>
            {isSelected ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                선택됨
              </span>
            ) : null}
          </span>
          {option.opt_en_nm ? (
            <span
              className={
                isSelected
                  ? "mt-1 block truncate text-xs text-white/75"
                  : "mt-1 block truncate text-xs text-neutral-500"
              }
            >
              {option.opt_en_nm}
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end justify-between gap-2 text-right">
        {isOptionSoldOut ? (
          <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
            품절
          </span>
        ) : (
          <span
            className={
              isSelected
                ? "inline-flex rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-neutral-950"
                : "inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-sm font-semibold text-neutral-700"
            }
          >
            {getOptionAmountLabel(option)}
          </span>
        )}
      </span>
    </button>
  );
}

export function ProductOptionSelector({ groupedOptions, product }: ProductOptionSelectorProps) {
  const isProductSoldOut = product.soldout_fl === "y";
  const addItem = useCartStore((state) => state.addItem);
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const mounted = useMounted();
  const hasOptions = groupedOptions.length > 0;
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() =>
    getDefaultSelectedOptions(groupedOptions, isProductSoldOut),
  );
  const [optionCounts, setOptionCounts] = useState<OptionCounts>({});
  const [didValidate, setDidValidate] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const selectedOptionItems = useMemo(
    () => getSelectedOptionItems(groupedOptions, selectedOptions, optionCounts),
    [groupedOptions, optionCounts, selectedOptions],
  );
  const selectedOptionTotal = selectedOptionItems.reduce(
    (total, item) => total + getOptionPrice(item.option) * item.count,
    0,
  );
  const finalPrice = Number(product.goods_price) + selectedOptionTotal;
  const missingRequiredGroups = groupedOptions.filter(
    (group) => !isGroupComplete(group, selectedOptions),
  );
  const isSelectionReady = !isProductSoldOut && missingRequiredGroups.length === 0;

  function toggleOption(group: MenuOptionGroup, option: MenuOption) {
    if (isProductSoldOut || option.soldout_fl === "y") {
      return;
    }

    setDidValidate(false);
    setSelectedOptions((current) => {
      const currentOptNos = current[group.opt_type] ?? [];
      const isSelected = currentOptNos.includes(option.opt_no);

      if (isSingleChoiceGroup(group)) {
        return {
          ...current,
          [group.opt_type]:
            isRequiredGroup(group) && isSelected
              ? currentOptNos
              : isSelected
                ? []
                : [option.opt_no],
        };
      }

      return {
        ...current,
        [group.opt_type]: isSelected
          ? currentOptNos.filter((optNo) => optNo !== option.opt_no)
          : [...currentOptNos, option.opt_no],
      };
    });
    setOptionCounts((current) => ({
      ...current,
      [option.opt_no]: 0,
    }));
    setCartMessage(null);
  }

  function updateCount(group: MenuOptionGroup, option: MenuOption, nextCount: number) {
    if (isProductSoldOut || option.soldout_fl === "y") {
      return;
    }

    const maxCount = getOptionMaxCount(option);
    const boundedCount = Math.min(Math.max(nextCount, 0), maxCount);

    setDidValidate(false);
    setOptionCounts((current) => ({
      ...current,
      [option.opt_no]: boundedCount,
    }));
    setSelectedOptions((current) => ({
      ...current,
      [group.opt_type]: (current[group.opt_type] ?? []).filter((optNo) => optNo !== option.opt_no),
    }));
    setCartMessage(null);
  }

  function addSelectedItemToCart() {
    setDidValidate(true);

    if (!isSelectionReady) {
      setCartMessage(null);
      return;
    }

    addItem({
      base_price: Number(product.goods_price),
      goods_nm: product.goods_nm,
      goods_no: product.goods_no,
      options: getCartOptions(selectedOptionItems),
    });
    setCartMessage("장바구니에 담았습니다.");
  }

  return (
    <>
      <section className="border-t border-neutral-100 px-4 py-5">
        <h2 className="text-base font-semibold text-neutral-950">
          {hasOptions ? "옵션 선택" : "옵션"}
        </h2>

        {hasOptions ? (
          <div className="mt-4 grid gap-6">
            {groupedOptions.map((group) => {
              const selectedOptNos = selectedOptions[group.opt_type] ?? [];
              const hasRequiredError =
                didValidate &&
                isRequiredGroup(group) &&
                selectedOptNos.length === 0 &&
                !isProductSoldOut;

              return (
                <div key={group.opt_type} className="rounded-2xl border border-neutral-200 bg-white">
                  <div className="flex items-center justify-between gap-3 px-4 pt-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-neutral-950">
                        {group.opt_type}
                      </h3>
                      <span className={getGroupBadgeClassName(group)}>
                        {getGroupBadgeLabel(group)}
                      </span>
                    </div>
                  </div>
                  {hasRequiredError ? (
                    <p className="mt-2 px-4 text-xs font-medium text-red-700">
                      {group.opt_type} 옵션을 선택하세요.
                    </p>
                  ) : null}

                  <div className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-b-2xl rounded-t-none border-t border-neutral-100">
                    {group.options.map((option) => {
                      const isDisabled = isProductSoldOut || option.soldout_fl === "y";

                      return isCounterOption(option) ? (
                        <CounterOptionRow
                          key={option.opt_no}
                          count={optionCounts[option.opt_no] ?? 0}
                          disabled={isDisabled}
                          group={group}
                          option={option}
                          updateCount={updateCount}
                        />
                      ) : (
                        <SelectOptionButton
                          key={option.opt_no}
                          disabled={isDisabled}
                          group={group}
                          isSelected={selectedOptNos.includes(option.opt_no)}
                          option={option}
                          toggleOption={toggleOption}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-5">
            <p className="text-sm font-semibold text-neutral-950">선택 옵션 없음</p>
            <p className="mt-1 text-sm text-neutral-500">
              이 상품은 옵션 선택 없이 바로 장바구니에 담을 수 있습니다.
            </p>
          </div>
        )}
      </section>

      <section
        className={`sticky ${
          mounted && cartItemCount > 0
            ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]"
            : "bottom-0"
        } border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur`}
      >
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-950">선택 옵션 요약</p>
              <p className="mt-1 text-xs text-neutral-500">
                선택 {selectedOptionItems.length}개
                {selectedOptionTotal > 0 ? ` · 추가 ${formatPrice(selectedOptionTotal)}원` : ""}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold text-neutral-950">
              {formatPrice(selectedOptionTotal)}원
            </p>
          </div>

          {selectedOptionItems.length === 0 ? (
            <p className="mt-4 rounded-xl bg-white px-3 py-3 text-sm text-neutral-500">
              {hasOptions ? "선택한 옵션이 없습니다." : "옵션 선택 없이 담을 수 있습니다."}
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {selectedOptionItems.map((item) => (
                <li
                  key={`${item.groupName}:${item.option.opt_no}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm text-neutral-600"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-neutral-400">
                      {item.groupName}
                    </span>
                    <span className="block truncate font-semibold text-neutral-950">
                      {item.option.opt_nm}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-sm font-semibold text-neutral-700">
                    {item.count > 1 ? `${item.count}개 · ` : null}+
                    {formatPrice(getOptionPrice(item.option) * item.count)}원
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-200 pt-3">
            <p className="text-sm font-medium text-neutral-500">최종 금액</p>
            <p className="text-2xl font-bold text-neutral-950">{formatPrice(finalPrice)}원</p>
          </div>
          {cartMessage ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
              {cartMessage}
            </p>
          ) : null}

          {isProductSoldOut ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-3 text-sm font-medium text-red-700">
              품절 상품은 옵션을 선택할 수 없습니다.
            </p>
          ) : (
            <button
              type="button"
              className={
                isSelectionReady
                  ? "mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-4 text-base font-semibold text-white transition duration-200 ease-out active:scale-[0.99]"
                  : "mt-4 w-full rounded-2xl bg-neutral-300 px-4 py-4 text-base font-semibold text-white"
              }
              onClick={addSelectedItemToCart}
            >
              장바구니 담기
            </button>
          )}
        </div>
      </section>
    </>
  );
}
