import { answers } from "@/content/answers";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { MenuRowLine } from "./MenuRowLine";
import { dishName } from "./ItemText";

/**
 * The cover's contents, set by answer: under «Как дела?» the eight answers from the hero's notice, each
 * beside the dish that answers it as a real menu row («Сонно | Эспрессо-тоник …… 290 ₽»). Each row is one
 * in-page link to the dish. Complete without JS; never red (the page's one red waits at the dish).
 * The day after a tear, «Вчера было «Сонно». А сегодня?» stands in for «Как дела?» (CSS, from html
 * attributes set before paint), and today's torn answer is marked, quietly.
 */
export function AnswersIndex() {
  return (
    <nav className="mn-answers" aria-label={t.menu.answersNav}>
      <p className="mn-answers__q" aria-hidden="true">
        <span data-mn-q>{t.hero.q}</span>
        {answers.map((a) => (
          <span key={a.id} className="mn-answers__yd" data-mn-yd={a.id}>
            {dishName(t.hero.yesterday(a.label))}
          </span>
        ))}
      </p>
      <ol className="mn-answers__list" role="list">
        {answers.map((a) => (
          <li key={a.id} className="mn-answers__item">
            <a className="mn-ans" href={`#${a.item.anchor}`} data-answer={a.id}>
              <span className="mn-ans__a display item-title">{dishName(a.label)}</span>
              <span className="sr-only">, </span>
              <MenuRowLine as="span" name={a.item.name} price={a.item.price} className="mn-ans__row" />
              <span className="mn-ans__today label">
                <span className="sr-only">, </span>
                {typograf(t.menu.today)}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
